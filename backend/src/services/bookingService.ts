import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Booking, { IBooking } from '../models/Booking';
import Charger from '../models/Charger';
import ChargingStation from '../models/ChargingStation';
import Vehicle from '../models/Vehicle';
import { ApiError } from '../utils/ApiError';
import { recalculateAvailability } from './stationService';

export interface CreateBookingInput {
  userId: string;
  stationId: string;
  chargerId: string;
  vehicleId: string;
  startTime: Date;
  durationMinutes: number;
}

/**
 * Core double-booking prevention: two bookings for the same charger conflict
 * when their time intervals overlap:
 *   existingStart < requestedEnd AND existingEnd > requestedStart
 * Only PENDING/CONFIRMED/ACTIVE bookings are considered "occupying" the slot.
 */
async function hasConflict(
  chargerId: string,
  startTime: Date,
  endTime: Date,
  session?: mongoose.ClientSession
): Promise<boolean> {
  const conflict = await Booking.findOne({
    chargerId,
    status: { $in: ['PENDING', 'CONFIRMED', 'ACTIVE'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  }).session(session ?? null);
  return !!conflict;
}

export async function createBooking(input: CreateBookingInput): Promise<IBooking> {
  const charger = await Charger.findById(input.chargerId);
  if (!charger) throw new ApiError(404, 'CHARGER_NOT_FOUND', 'Charger not found.');
  if (charger.stationId.toString() !== input.stationId) {
    throw new ApiError(400, 'STATION_MISMATCH', 'Charger does not belong to the given station.');
  }
  const vehicle = await Vehicle.findOne({ _id: input.vehicleId, userId: input.userId });
  if (!vehicle) throw new ApiError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found for this user.');

  const startTime = input.startTime;
  const endTime = new Date(startTime.getTime() + input.durationMinutes * 60000);
  if (endTime <= startTime) {
    throw new ApiError(400, 'INVALID_TIME_RANGE', 'End time must be after start time.');
  }
  if (startTime.getTime() < Date.now() - 5 * 60000) {
    throw new ApiError(400, 'INVALID_START_TIME', 'Start time cannot be in the past.');
  }

  // Use a MongoDB session/transaction where supported (replica-set MongoDB)
  // to keep the conflict check and insert atomic. Falls back gracefully to a
  // non-transactional path on standalone MongoDB instances used for local
  // academic demos, where transactions are unavailable.
  const dbSession = await mongoose.startSession();
  let booking: IBooking | null = null;
  try {
    await dbSession.withTransaction(async () => {
      const conflict = await hasConflict(input.chargerId, startTime, endTime, dbSession);
      if (conflict) {
        throw new ApiError(409, 'BOOKING_CONFLICT', 'The selected charger is already reserved for this time.');
      }
      const created = await Booking.create(
        [
          {
            userId: input.userId,
            stationId: input.stationId,
            chargerId: input.chargerId,
            vehicleId: input.vehicleId,
            startTime,
            endTime,
            durationMinutes: input.durationMinutes,
            status: 'CONFIRMED',
            qrToken: uuidv4(),
            paymentStatus: 'UNPAID',
          },
        ],
        { session: dbSession }
      );
      booking = created[0];
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Standalone MongoDB (no replica set) throws on transactions; retry
    // without one and rely on the unique-ish overlap check best-effort.
    const conflict = await hasConflict(input.chargerId, startTime, endTime);
    if (conflict) {
      throw new ApiError(409, 'BOOKING_CONFLICT', 'The selected charger is already reserved for this time.');
    }
    booking = await Booking.create({
      userId: input.userId,
      stationId: input.stationId,
      chargerId: input.chargerId,
      vehicleId: input.vehicleId,
      startTime,
      endTime,
      durationMinutes: input.durationMinutes,
      status: 'CONFIRMED',
      qrToken: uuidv4(),
      paymentStatus: 'UNPAID',
    });
  } finally {
    await dbSession.endSession();
  }

  if (!booking) throw new ApiError(500, 'BOOKING_FAILED', 'Failed to create booking.');
  return booking;
}

export async function cancelBooking(bookingId: string, userId: string, isAdmin = false): Promise<IBooking> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  if (!isAdmin && booking.userId.toString() !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'You cannot cancel this booking.');
  }
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    throw new ApiError(400, 'INVALID_STATUS', `Booking in status ${booking.status} cannot be cancelled.`);
  }
  booking.status = 'CANCELLED';
  await booking.save();
  return booking;
}

export async function listUserBookings(userId: string) {
  return Booking.find({ userId }).sort({ startTime: -1 }).lean();
}

export async function getBookingById(bookingId: string, userId: string, isAdmin = false) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  if (!isAdmin && booking.userId.toString() !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'You cannot view this booking.');
  }
  return booking;
}

/** Marks past CONFIRMED bookings that were never checked in as EXPIRED. Intended to run as a periodic job. */
export async function expireStaleBookings(graceMinutes = 15): Promise<number> {
  const cutoff = new Date(Date.now() - graceMinutes * 60000);
  const result = await Booking.updateMany(
    { status: 'CONFIRMED', endTime: { $lt: cutoff } },
    { $set: { status: 'EXPIRED' } }
  );
  return result.modifiedCount ?? 0;
}

export async function validateAndActivateByQr(qrToken: string): Promise<IBooking> {
  const booking = await Booking.findOne({ qrToken });
  if (!booking) throw new ApiError(404, 'INVALID_QR', 'QR code is invalid.');
  if (booking.status !== 'CONFIRMED') {
    throw new ApiError(400, 'QR_NOT_VALID', `Booking is ${booking.status.toLowerCase()} and cannot be checked in.`);
  }
  const now = Date.now();
  const windowStart = booking.startTime.getTime() - 10 * 60000;
  if (now < windowStart) {
    throw new ApiError(400, 'TOO_EARLY', 'Check-in window has not opened yet.');
  }
  if (now > booking.endTime.getTime()) {
    booking.status = 'EXPIRED';
    await booking.save();
    throw new ApiError(400, 'QR_EXPIRED', 'This booking has expired.');
  }
  booking.status = 'ACTIVE';
  await booking.save();
  await ChargingStation.exists({ _id: booking.stationId }); // sanity touch, keeps station referenced
  await recalculateAvailability(booking.stationId.toString());
  return booking;
}
