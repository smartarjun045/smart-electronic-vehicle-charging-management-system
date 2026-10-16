import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok } from '../utils/apiResponse';
import * as stationService from '../services/stationService';
import { ApiError } from '../utils/ApiError';

export const nearby = asyncHandler(async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new ApiError(400, 'INVALID_COORDINATES', 'lat and lng query params are required numbers.');
  }
  const stations = await stationService.findNearbyStations({
    lat,
    lng,
    radiusKm: req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : undefined,
    connectorType: req.query.connectorType as string | undefined,
    minPowerKW: req.query.minPowerKW ? parseFloat(req.query.minPowerKW as string) : undefined,
    maxPricePerKWh: req.query.maxPricePerKWh ? parseFloat(req.query.maxPricePerKWh as string) : undefined,
    onlyAvailable: req.query.onlyAvailable === 'true',
    minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
    renewableEnergy: req.query.renewableEnergy === 'true',
    city: req.query.city as string | undefined,
  });
  ok(res, stations);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const result = await stationService.getStationById(req.params.id);
  ok(res, result);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  // Simple listing endpoint for the /stations browse page (paginated).
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 100);
  const ChargingStation = (await import('../models/ChargingStation')).default;
  const filter: Record<string, unknown> = { status: 'ACTIVE' };
  if (req.query.city) filter.city = req.query.city;
  const [items, total] = await Promise.all([
    ChargingStation.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ChargingStation.countDocuments(filter),
  ]);
  ok(res, { items, total, page, limit });
});
