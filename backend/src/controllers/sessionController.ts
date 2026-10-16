import { Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as simulator from '../services/chargingSimulatorService';

export const start = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const session = await simulator.startChargingSession(req.body.bookingId, req.user!.userId);
  ok(res, session, 201);
});

export const stop = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const session = await simulator.stopChargingSession(req.params.id, req.user!.userId);
  ok(res, session);
});

export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = req.user!.role === 'ADMIN';
  const session = await simulator.getSessionById(req.params.id, req.user!.userId, isAdmin);
  ok(res, session);
});
