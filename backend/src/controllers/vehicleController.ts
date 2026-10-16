import { Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as vehicleService from '../services/vehicleService';

export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vehicle = await vehicleService.createVehicle(req.user!.userId, req.body);
  ok(res, vehicle, 201);
});

export const list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vehicles = await vehicleService.listVehicles(req.user!.userId);
  ok(res, vehicles);
});

export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await vehicleService.deleteVehicle(req.params.id, req.user!.userId);
  ok(res, { deleted: true });
});
