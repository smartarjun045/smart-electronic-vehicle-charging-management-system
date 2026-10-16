import { Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as billingService from '../services/billingService';

export const getByBookingId = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const isAdmin = req.user!.role === 'ADMIN';
  const invoice = await billingService.getInvoiceByBookingId(req.params.bookingId, req.user!.userId, isAdmin);
  ok(res, invoice);
});

export const listMine = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const invoices = await billingService.listUserInvoices(req.user!.userId);
  ok(res, invoices);
});
