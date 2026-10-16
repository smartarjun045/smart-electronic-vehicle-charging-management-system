import { z } from 'zod';

export const createVehicleSchema = z.object({
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  batteryCapacityKWh: z.number().positive(),
  currentBatteryPercentage: z.number().min(0).max(100).optional(),
  connectorType: z.enum(['CCS2', 'CHAdeMO', 'Type2', 'GB/T', 'Bharat AC001', 'Bharat DC001']),
  registrationNumber: z.string().min(3),
  chargingSpeedKW: z.number().positive().optional(),
  efficiencyKmPerKWh: z.number().positive().optional(),
});
