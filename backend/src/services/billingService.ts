import { v4 as uuidv4 } from 'uuid';
import ChargingSession from '../models/ChargingSession';
import Booking from '../models/Booking';
import ChargingStation from '../models/ChargingStation';
import Payment from '../models/Payment';
import { ApiError } from '../utils/ApiError';

const BOOKING_FEE = 10; // flat simulated convenience fee in INR

export async function createInvoiceForSession(sessionId: string) {
  const session = await ChargingSession.findById(sessionId);
  if (!session) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Charging session not found.');
  const booking = await Booking.findById(session.bookingId);
  if (!booking) throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  const station = await ChargingStation.findById(booking.stationId);

  const energyCost = round2(session.energyConsumedKWh * (station?.pricePerKWh ?? 12));
  const parkingFee = station?.parkingFee ?? 0;
  const total = round2(energyCost + parkingFee + BOOKING_FEE);

  const payment = await Payment.create({
    bookingId: booking._id,
    userId: session.userId,
    amount: total,
    currency: 'INR',
    paymentMethod: 'SIMULATED_WALLET',
    transactionId: `SIM-${uuidv4()}`,
    status: 'SUCCESS',
    breakdown: { energyCost, parkingFee, bookingFee: BOOKING_FEE },
    paidAt: new Date(),
  });

  return payment;
}

export async function getInvoiceByBookingId(bookingId: string, userId: string, isAdmin = false) {
  const payment = await Payment.findOne({ bookingId });
  if (!payment) throw new ApiError(404, 'INVOICE_NOT_FOUND', 'No invoice found for this booking.');
  if (!isAdmin && payment.userId.toString() !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'Not your invoice.');
  }
  return payment;
}

export async function listUserInvoices(userId: string) {
  return Payment.find({ userId }).sort({ createdAt: -1 }).lean();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
