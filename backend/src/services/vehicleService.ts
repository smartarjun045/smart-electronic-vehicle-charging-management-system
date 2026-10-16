import Vehicle from '../models/Vehicle';
import { ApiError } from '../utils/ApiError';

export async function createVehicle(userId: string, input: Record<string, unknown>) {
  return Vehicle.create({ ...input, userId });
}

export async function listVehicles(userId: string) {
  return Vehicle.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function getVehicle(vehicleId: string, userId: string) {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, userId });
  if (!vehicle) throw new ApiError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found.');
  return vehicle;
}

export async function deleteVehicle(vehicleId: string, userId: string) {
  const result = await Vehicle.findOneAndDelete({ _id: vehicleId, userId });
  if (!result) throw new ApiError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found.');
  return result;
}
