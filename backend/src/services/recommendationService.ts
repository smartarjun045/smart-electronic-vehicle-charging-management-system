import { haversineDistanceKm } from '../utils/geo';
import ChargingStation from '../models/ChargingStation';
import Charger from '../models/Charger';

export interface RecommendationWeights {
  availability: number;
  distance: number;
  chargingSpeed: number;
  price: number;
  waitingTime: number;
  rating: number;
}

export const DEFAULT_WEIGHTS: RecommendationWeights = {
  availability: 0.25,
  distance: 0.2,
  chargingSpeed: 0.2,
  price: 0.15,
  waitingTime: 0.1,
  rating: 0.1,
};

export interface RecommendationInput {
  lat: number;
  lng: number;
  connectorType?: string;
  radiusKm?: number;
  weights?: Partial<RecommendationWeights>;
}

export interface StationScore {
  stationId: string;
  name: string;
  distanceKm: number;
  score: number;
  reasons: string[];
  breakdown: Record<string, number>;
}

/**
 * Transparent, explainable scoring engine (not a black box). Every score is
 * a weighted sum of normalized sub-scores in [0,1]; the "reasons" array is
 * derived directly from the same inputs used to compute the score, so the
 * explanation always matches the number shown to the user.
 */
export async function recommendStations(input: RecommendationInput): Promise<StationScore[]> {
  const weights = { ...DEFAULT_WEIGHTS, ...input.weights };
  const radiusKm = input.radiusKm ?? 15;

  const stations = await ChargingStation.find({ status: 'ACTIVE' }).lean();
  const maxPrice = Math.max(...stations.map((s) => s.pricePerKWh), 1);
  const maxPower = 150; // reference fast-charging ceiling for normalization

  const results: StationScore[] = [];

  for (const station of stations) {
    const distanceKm = haversineDistanceKm(input.lat, input.lng, station.latitude, station.longitude);
    if (distanceKm > radiusKm) continue;

    const chargers = await Charger.find({ stationId: station._id }).lean();
    const relevantChargers = input.connectorType
      ? chargers.filter((c) => c.connectorType === input.connectorType)
      : chargers;
    if (input.connectorType && relevantChargers.length === 0) continue;

    const availableCount = relevantChargers.filter((c) => c.status === 'AVAILABLE').length;
    const maxPowerAtStation = relevantChargers.length
      ? Math.max(...relevantChargers.map((c) => c.powerKW))
      : 0;

    const availabilityScore = relevantChargers.length ? availableCount / relevantChargers.length : 0;
    const distanceScore = Math.max(0, 1 - distanceKm / radiusKm);
    const chargingSpeedScore = Math.min(1, maxPowerAtStation / maxPower);
    const priceScore = Math.max(0, 1 - station.pricePerKWh / maxPrice);
    // Estimated waiting time: 0 minutes if a charger is free, else a flat
    // estimate per busy charger — clearly labelled as an estimate, not
    // live queue telemetry (see docs/LIMITATIONS.md).
    const estimatedWaitMinutes = availableCount > 0 ? 0 : 15;
    const waitingTimeScore = availableCount > 0 ? 1 : 0.3;
    const ratingScore = station.rating / 5;

    const score =
      weights.availability * availabilityScore +
      weights.distance * distanceScore +
      weights.chargingSpeed * chargingSpeedScore +
      weights.price * priceScore +
      weights.waitingTime * waitingTimeScore +
      weights.rating * ratingScore;

    const reasons: string[] = [`${round1(distanceKm)} km away`];
    if (availableCount > 0) reasons.push(`${availableCount} charger(s) available now`);
    else reasons.push('No chargers free right now (est. ~15 min wait)');
    if (maxPowerAtStation >= 50) reasons.push(`Fast charging up to ${maxPowerAtStation} kW`);
    if (station.pricePerKWh <= maxPrice * 0.6) reasons.push('Below-average price per kWh');
    if (station.rating >= 4.3) reasons.push(`Highly rated (${station.rating}/5)`);
    if (input.connectorType) reasons.push(`Compatible ${input.connectorType} connector`);

    results.push({
      stationId: station._id.toString(),
      name: station.name,
      distanceKm: round1(distanceKm),
      score: round2(score),
      reasons,
      breakdown: {
        availabilityScore: round2(availabilityScore),
        distanceScore: round2(distanceScore),
        chargingSpeedScore: round2(chargingSpeedScore),
        priceScore: round2(priceScore),
        waitingTimeScore: round2(waitingTimeScore),
        ratingScore: round2(ratingScore),
        estimatedWaitMinutes,
      },
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
