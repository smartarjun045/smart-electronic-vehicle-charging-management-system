import { Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/auth';
import User from '../models/User';
import { ApiError } from '../utils/ApiError';

export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user!.userId).select('-passwordHash');
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.');
  ok(res, user);
});
