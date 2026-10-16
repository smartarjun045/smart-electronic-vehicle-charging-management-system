export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'STATION_OPERATOR';
  greenPoints: number;
}

export interface Vehicle {
  _id: string;
  manufacturer: string;
  model: string;
  batteryCapacityKWh: number;
  currentBatteryPercentage: number;
  connectorType: string;
  registrationNumber: string;
  chargingSpeedKW: number;
}

export interface Station {
  _id: string;
  name: string;
  operator: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  amenities: string[];
  renewableEnergy: boolean;
  rating: number;
  totalChargers: number;
  availableChargers: number;
  pricePerKWh: number;
  parkingFee: number;
  status: string;
  distanceKm?: number;
}

export interface Charger {
  _id: string;
  stationId: string;
  chargerCode: string;
  connectorType: string;
  powerKW: number;
  chargingType: 'AC' | 'DC';
  status: string;
}

export interface Booking {
  _id: string;
  userId: string;
  stationId: string;
  chargerId: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  qrToken: string;
  paymentStatus: string;
}

export interface ChargingSession {
  _id: string;
  bookingId: string;
  chargerId: string;
  initialBatteryPercentage: number;
  finalBatteryPercentage: number;
  energyConsumedKWh: number;
  chargingPowerKW: number;
  cost: number;
  status: string;
}

export interface RecommendedStation {
  stationId: string;
  name: string;
  distanceKm: number;
  score: number;
  reasons: string[];
  breakdown: Record<string, number>;
}
