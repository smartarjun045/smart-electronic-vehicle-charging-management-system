import Vehicle from '../models/Vehicle';
import { ApiError } from '../utils/ApiError';
import { recommendStations } from './recommendationService';

/**
 * Deterministic (non-ML) range-aware recommendation, per spec section 18.
 * availableRangeKm = batteryCapacityKWh * (currentBatteryPercentage/100) * efficiencyKmPerKWh
 * All outputs are clearly labelled ESTIMATED — see docs/LIMITATIONS.md.
 */
export async function estimateRangeAndSuggest(params: {
  vehicleId: string;
  userId: string;
  destinationDistanceKm?: number;
  lat: number;
  lng: number;
}) {
  const vehicle = await Vehicle.findOne({ _id: params.vehicleId, userId: params.userId });
  if (!vehicle) throw new ApiError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found.');

  const availableRangeKm = round1(
    vehicle.batteryCapacityKWh * (vehicle.currentBatteryPercentage / 100) * vehicle.efficiencyKmPerKWh
  );

  const destination = params.destinationDistanceKm ?? 0;
  const sufficientRange = destination === 0 || availableRangeKm >= destination * 1.15; // 15% safety margin

  let suggestions: unknown[] = [];
  if (!sufficientRange) {
    suggestions = await recommendStations({ lat: params.lat, lng: params.lng, connectorType: vehicle.connectorType });
  }

  return {
    estimate: true,
    availableRangeKm,
    destinationDistanceKm: destination,
    sufficientRange,
    safetyMarginApplied: '15%',
    suggestedStations: suggestions,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
