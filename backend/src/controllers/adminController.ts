import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok } from '../utils/apiResponse';
import * as analyticsService from '../services/analyticsService';
import User from '../models/User';
import ChargingStation from '../models/ChargingStation';
import Charger from '../models/Charger';
import Booking from '../models/Booking';
import ChargingSession from '../models/ChargingSession';
import MaintenanceRecord from '../models/MaintenanceRecord';
import { recalculateAvailability } from '../services/stationService';
import { ApiError } from '../utils/ApiError';
import { getRecentLog } from '../ocpp/ocppSimulator';

export const overview = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await analyticsService.getOverview());
});

export const bookingsByDay = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await analyticsService.getBookingsByDay(req.query.days ? Number(req.query.days) : undefined));
});

export const revenueByDay = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await analyticsService.getRevenueByDay(req.query.days ? Number(req.query.days) : undefined));
});

export const stationUtilization = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await analyticsService.getStationUtilization());
});

export const chargerStatusBreakdown = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await analyticsService.getChargerStatusBreakdown());
});

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await User.find({}).select('-passwordHash').sort({ createdAt: -1 }).lean());
});

export const listStations = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await ChargingStation.find({}).sort({ createdAt: -1 }).lean());
});

export const createStation = asyncHandler(async (req: Request, res: Response) => {
  const station = await ChargingStation.create(req.body);
  ok(res, station, 201);
});

export const updateStation = asyncHandler(async (req: Request, res: Response) => {
  const station = await ChargingStation.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!station) throw new ApiError(404, 'STATION_NOT_FOUND', 'Station not found.');
  ok(res, station);
});

export const listChargers = asyncHandler(async (req: Request, res: Response) => {
  const filter = req.query.stationId ? { stationId: req.query.stationId } : {};
  ok(res, await Charger.find(filter).sort({ createdAt: -1 }).lean());
});

export const createCharger = asyncHandler(async (req: Request, res: Response) => {
  const charger = await Charger.create(req.body);
  await recalculateAvailability(charger.stationId.toString());
  ok(res, charger, 201);
});

export const updateChargerStatus = asyncHandler(async (req: Request, res: Response) => {
  const charger = await Charger.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, maintenanceStatus: req.body.maintenanceStatus },
    { new: true }
  );
  if (!charger) throw new ApiError(404, 'CHARGER_NOT_FOUND', 'Charger not found.');
  await recalculateAvailability(charger.stationId.toString());
  ok(res, charger);
});

export const listBookings = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await Booking.find({}).sort({ createdAt: -1 }).limit(200).lean());
});

export const listSessions = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await ChargingSession.find({}).sort({ createdAt: -1 }).limit(200).lean());
});

export const createMaintenanceRecord = asyncHandler(async (req: Request, res: Response) => {
  const record = await MaintenanceRecord.create(req.body);
  await Charger.findByIdAndUpdate(req.body.chargerId, { maintenanceStatus: req.body.severity === 'CRITICAL' ? 'FAULT' : 'MAINTENANCE' });
  ok(res, record, 201);
});

export const listMaintenanceRecords = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await MaintenanceRecord.find({}).sort({ createdAt: -1 }).lean());
});

export const ocppLog = asyncHandler(async (req: Request, res: Response) => {
  ok(res, getRecentLog(req.query.limit ? Number(req.query.limit) : undefined));
});
