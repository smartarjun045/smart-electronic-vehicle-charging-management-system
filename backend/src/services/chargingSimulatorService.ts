import { Server as SocketIOServer } from 'socket.io';
import ChargingSession from '../models/ChargingSession';
import Charger from '../models/Charger';
import Booking from '../models/Booking';
import Vehicle from '../models/Vehicle';
import ChargingStation from '../models/ChargingStation';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { recalculateAvailability } from './stationService';
import { awardPoints } from './rewardService';
import { createInvoiceForSession } from './billingService';
import * as ocpp from '../ocpp/ocppSimulator';

// Active simulation timers keyed by session id, so charging progress
// continues server-side even if no client is connected, and can be torn
// down cleanly on completion/cancellation.
const activeTimers = new Map<string, NodeJS.Timeout>();

let ioRef: SocketIOServer | null = null;
export function attachSocketServer(io: SocketIOServer) {
  ioRef = io;
}

function emitToUser(userId: string, event: string, payload: unknown) {
  if (!ioRef) return;
  ioRef.to(`user:${userId}`).emit(event, payload);
}

export async function startChargingSession(bookingId: string, userId: string) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  if (booking.userId.toString() !== userId) throw new ApiError(403, 'FORBIDDEN', 'Not your booking.');
  if (booking.status !== 'ACTIVE') {
    throw new ApiError(400, 'INVALID_STATE', 'Booking must be checked in (ACTIVE) before charging can start.');
  }

  const charger = await Charger.findById(booking.chargerId);
  if (!charger) throw new ApiError(404, 'CHARGER_NOT_FOUND', 'Charger not found.');
  const vehicle = await Vehicle.findById(booking.vehicleId);
  if (!vehicle) throw new ApiError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found.');

  charger.status = 'PREPARING';
  charger.ocppStatus = 'Preparing';
  await charger.save();
  await recalculateAvailability(charger.stationId.toString());
  ocpp.statusNotification(charger.chargerCode, 'Preparing');
  ocpp.authorize(charger.chargerCode, userId);

  const session = await ChargingSession.create({
    bookingId: booking._id,
    userId,
    chargerId: charger._id,
    startedAt: new Date(),
    initialBatteryPercentage: vehicle.currentBatteryPercentage,
    finalBatteryPercentage: vehicle.currentBatteryPercentage,
    energyConsumedKWh: 0,
    chargingPowerKW: Math.min(charger.powerKW, vehicle.chargingSpeedKW || charger.powerKW),
    cost: 0,
    status: 'CHARGING',
    meterValues: [],
  });

  charger.status = 'CHARGING';
  charger.ocppStatus = 'Charging';
  charger.currentSessionId = session._id;
  await charger.save();
  await recalculateAvailability(charger.stationId.toString());
  ocpp.statusNotification(charger.chargerCode, 'Charging');
  ocpp.startTransaction(charger.chargerCode, session._id.toString(), 0);

  const station = await ChargingStation.findById(charger.stationId);
  const pricePerKWh = station?.pricePerKWh ?? 12;

  emitToUser(userId, 'charging:started', { sessionId: session._id, chargerId: charger._id });

  scheduleTick(session._id.toString(), userId, pricePerKWh);

  return session;
}

function scheduleTick(sessionId: string, userId: string, pricePerKWh: number) {
  const timer = setInterval(async () => {
    try {
      await tick(sessionId, userId, pricePerKWh);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[simulator] tick failed for session ${sessionId}`, err);
      clearTimer(sessionId);
    }
  }, env.chargingTickMs);
  activeTimers.set(sessionId, timer);
}

function clearTimer(sessionId: string) {
  const t = activeTimers.get(sessionId);
  if (t) {
    clearInterval(t);
    activeTimers.delete(sessionId);
  }
}

async function tick(sessionId: string, userId: string, pricePerKWh: number) {
  const session = await ChargingSession.findById(sessionId);
  if (!session || session.status !== 'CHARGING') {
    clearTimer(sessionId);
    return;
  }

  // Simulate battery percentage increasing by a randomized step, energy
  // consumption derived from charger power * tick duration, tapering as it
  // approaches 100% (simple linear-taper model — documented as an estimate,
  // not real telemetry, in docs/LIMITATIONS.md).
  const tickHours = env.chargingTickMs / 3600000;
  const remainingPct = 100 - session.finalBatteryPercentage;
  const taper = remainingPct < 20 ? 0.4 : 1;
  const powerNow = session.chargingPowerKW * taper;
  const energyThisTick = powerNow * tickHours * 6; // accelerated for demo purposes

  const newEnergy = round2(session.energyConsumedKWh + energyThisTick);
  const batteryCapacityKWh = await getVehicleCapacity(session.bookingId.toString());
  const newPct = Math.min(100, round2(session.finalBatteryPercentage + (energyThisTick / batteryCapacityKWh) * 100));
  const newCost = round2(newEnergy * pricePerKWh);

  session.energyConsumedKWh = newEnergy;
  session.finalBatteryPercentage = newPct;
  session.cost = newCost;
  session.meterValues.push({
    timestamp: new Date(),
    batteryPercentage: newPct,
    energyConsumedKWh: newEnergy,
    powerKW: round2(powerNow),
  });

  const charger = await Charger.findById(session.chargerId).select('chargerCode').lean();
  if (charger) {
    ocpp.meterValues(charger.chargerCode, sessionId, Math.round(newEnergy * 1000));
  }

  const done = newPct >= 100;
  if (done) {
    session.status = 'COMPLETED';
    session.endedAt = new Date();
  }
  await session.save();

  emitToUser(userId, 'charging:progress', {
    sessionId,
    batteryPercentage: newPct,
    energyConsumedKWh: newEnergy,
    cost: newCost,
    powerKW: round2(powerNow),
    status: session.status,
  });

  if (done) {
    clearTimer(sessionId);
    await completeSession(sessionId, userId);
  }
}

async function getVehicleCapacity(bookingId: string): Promise<number> {
  const booking = await Booking.findById(bookingId);
  if (!booking) return 40;
  const vehicle = await Vehicle.findById(booking.vehicleId);
  return vehicle?.batteryCapacityKWh ?? 40;
}

async function completeSession(sessionId: string, userId: string) {
  const session = await ChargingSession.findById(sessionId);
  if (!session) return;

  const charger = await Charger.findById(session.chargerId);
  if (charger) {
    ocpp.stopTransaction(charger.chargerCode, sessionId, Math.round(session.energyConsumedKWh * 1000));
    charger.status = 'FINISHING';
    charger.ocppStatus = 'Finishing';
    charger.currentSessionId = null;
    await charger.save();
    ocpp.statusNotification(charger.chargerCode, 'Finishing');
    setTimeout(async () => {
      charger.status = 'AVAILABLE';
      charger.ocppStatus = 'Available';
      await charger.save();
      await recalculateAvailability(charger.stationId.toString());
    }, 3000);
  }

  const booking = await Booking.findById(session.bookingId);
  if (booking) {
    booking.status = 'COMPLETED';
    booking.paymentStatus = 'PAID';
    await booking.save();
  }

  const vehicle = booking ? await Vehicle.findById(booking.vehicleId) : null;
  if (vehicle) {
    vehicle.currentBatteryPercentage = session.finalBatteryPercentage;
    await vehicle.save();
  }

  const points = Math.max(1, Math.round(session.energyConsumedKWh * 2));
  await awardPoints(userId, points, 'Charging session completed');

  const invoice = await createInvoiceForSession(session._id.toString());

  emitToUser(userId, 'charging:completed', {
    sessionId,
    finalBatteryPercentage: session.finalBatteryPercentage,
    energyConsumedKWh: session.energyConsumedKWh,
    cost: session.cost,
    rewardPoints: points,
    invoiceId: invoice._id,
  });
  emitToUser(userId, 'notification:new', {
    title: 'Charging complete',
    message: `Your vehicle is now at ${session.finalBatteryPercentage}%. You earned ${points} green points.`,
  });
}

export async function stopChargingSession(sessionId: string, userId: string) {
  const session = await ChargingSession.findById(sessionId);
  if (!session) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Charging session not found.');
  if (session.userId.toString() !== userId) throw new ApiError(403, 'FORBIDDEN', 'Not your session.');
  if (session.status !== 'CHARGING') {
    throw new ApiError(400, 'INVALID_STATE', 'Session is not currently charging.');
  }
  clearTimer(sessionId);
  session.status = 'COMPLETED';
  session.endedAt = new Date();
  await session.save();
  await completeSession(sessionId, userId);
  return session;
}

export async function getSessionById(sessionId: string, userId: string, isAdmin = false) {
  const session = await ChargingSession.findById(sessionId);
  if (!session) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Charging session not found.');
  if (!isAdmin && session.userId.toString() !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'Not your session.');
  }
  return session;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
