import { z } from 'zod';

export const createBookingSchema = z.object({
  stationId: z.string(),
  chargerId: z.string(),
  vehicleId: z.string(),
  startTime: z.string().datetime().or(z.string()),
  durationMinutes: z.number().int().min(10).max(240),
});
