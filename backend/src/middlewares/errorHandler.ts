import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { fail } from '../utils/apiResponse';

export function notFoundHandler(req: Request, res: Response) {
  fail(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return fail(res, err.statusCode, err.code, err.message);
  }
  // eslint-disable-next-line no-console
  console.error('[unhandled error]', err);
  return fail(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
