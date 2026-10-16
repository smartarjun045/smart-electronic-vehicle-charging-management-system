import { Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as rewardService from '../services/rewardService';

export const history = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const rewards = await rewardService.getRewardHistory(req.user!.userId);
  ok(res, rewards);
});
