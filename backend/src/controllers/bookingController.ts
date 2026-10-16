import { Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as bookingService from '../services/bookingService';
import { generateQrDataUrl } from '../services/qrService';

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await bookingService.createBooking({
    userId: req.user!.userId,
    stationId: req.body.stationId,
    chargerId: req.body.chargerId,
    vehicleId: req.body.vehicleId,
    startTime: new Date(req.body.startTime),
    durationMinutes: req.body.durationMinutes,
  });
  const qrDataUrl = await generateQrDataUrl(booking.qrToken);
  ok(res, { booking, qrDataUrl }, 201);
});

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const bookings = await bookingService.listUserBookings(req.user!.userId);
  ok(res, bookings);
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = req.user!.role === 'ADMIN';
  const booking = await bookingService.getBookingById(req.params.id, req.user!.userId, isAdmin);
  ok(res, booking);
});

export const cancel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = req.user!.role === 'ADMIN';
  const booking = await bookingService.cancelBooking(req.params.id, req.user!.userId, isAdmin);
  ok(res, booking);
});

export const checkIn = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await bookingService.validateAndActivateByQr(req.body.qrToken);
  ok(res, booking);
});
