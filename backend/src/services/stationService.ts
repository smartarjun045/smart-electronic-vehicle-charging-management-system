import ChargingStation, { IChargingStation } from '../models/ChargingStation';
import Charger from '../models/Charger';
import { haversineDistanceKm } from '../utils/geo';
import { ApiError } from '../utils/ApiError';

export interface StationFilters {
  connectorType?: string;
  minPowerKW?: number;
  maxPricePerKWh?: number;
  onlyAvailable?: boolean;
  minRating?: number;
  renewableEnergy?: boolean;
  city?: string;
}

export interface NearbyQuery extends StationFilters {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
}

export async function findNearbyStations(query: NearbyQuery) {
  const radiusKm = query.radiusKm ?? 15;
  const filter: Record<string, unknown> = { status: 'ACTIVE' };
  if (query.city) filter.city = new RegExp(`^${escapeRegex(query.city)}$`, 'i');
  if (query.renewableEnergy) filter.renewableEnergy = true;
  if (query.minRating) filter.rating = { $gte: query.minRating };
  if (query.maxPricePerKWh) filter.pricePerKWh = { $lte: query.maxPricePerKWh };
  if (query.onlyAvailable) filter.availableChargers = { $gt: 0 };

  // Rough bounding box pre-filter to limit the candidate set before the
  // precise Haversine calculation (keeps this affordable without a
  // geospatial index; see docs/ARCHITECTURE.md for the scaling note).
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((query.lat * Math.PI) / 180) || 1);
  filter.latitude = { $gte: query.lat - latDelta, $lte: query.lat + latDelta };
  filter.longitude = { $gte: query.lng - lngDelta, $lte: query.lng + lngDelta };

  let stations = await ChargingStation.find(filter).lean();

  if (query.connectorType) {
    const chargers = await Charger.find({ connectorType: query.connectorType }).select('stationId').lean();
    const stationIds = new Set(chargers.map((c) => c.stationId.toString()));
    stations = stations.filter((s) => stationIds.has((s._id as any).toString()));
  }
  if (query.minPowerKW) {
    const chargers = await Charger.find({ powerKW: { $gte: query.minPowerKW } }).select('stationId').lean();
    const stationIds = new Set(chargers.map((c) => c.stationId.toString()));
    stations = stations.filter((s) => stationIds.has((s._id as any).toString()));
  }

  const withDistance = stations
    .map((s) => ({
      ...s,
      distanceKm: round2(haversineDistanceKm(query.lat, query.lng, s.latitude, s.longitude)),
    }))
    .filter((s) => s.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return withDistance.slice(0, query.limit ?? 50);
}

export async function getStationById(id: string) {
  const station = await ChargingStation.findById(id).lean();
  if (!station) {
    throw new ApiError(404, 'STATION_NOT_FOUND', 'Charging station not found.');
  }
  const chargers = await Charger.find({ stationId: id }).lean();
  return { station, chargers };
}

export async function recalculateAvailability(stationId: string) {
  const total = await Charger.countDocuments({ stationId });
  const available = await Charger.countDocuments({ stationId, status: 'AVAILABLE' });
  await ChargingStation.findByIdAndUpdate(stationId, {
    totalChargers: total,
    availableChargers: available,
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export type { IChargingStation };
