import { Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/auth';
import { estimateRangeAndSuggest } from '../services/rangeService';

export const estimate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await estimateRangeAndSuggest({
    vehicleId: req.body.vehicleId,
    userId: req.user!.userId,
    destinationDistanceKm: req.body.destinationDistanceKm,
    lat: req.body.lat,
    lng: req.body.lng,
  });
  ok(res, result);
});
