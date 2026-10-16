import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok } from '../utils/apiResponse';
import { recommendStations } from '../services/recommendationService';
import { ApiError } from '../utils/ApiError';

export const recommend = asyncHandler(async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new ApiError(400, 'INVALID_COORDINATES', 'lat and lng query params are required numbers.');
  }
  const results = await recommendStations({
    lat,
    lng,
    connectorType: req.query.connectorType as string | undefined,
    radiusKm: req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : undefined,
  });
  ok(res, results);
});
