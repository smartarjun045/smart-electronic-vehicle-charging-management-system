import { Schema, model, Document, Types } from 'mongoose';

export interface IChargingStation extends Document {
  _id: Types.ObjectId;
  name: string;
  operator: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
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
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ChargingStationSchema = new Schema<IChargingStation>(
  {
    name: { type: String, required: true },
    operator: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true, default: 'Maharashtra' },
    pincode: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    openingHours: { type: String, default: '24/7' },
    amenities: [{ type: String }],
    renewableEnergy: { type: Boolean, default: false },
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    totalChargers: { type: Number, default: 0 },
    availableChargers: { type: Number, default: 0 },
    pricePerKWh: { type: Number, required: true },
    parkingFee: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'], default: 'ACTIVE' },
    images: [{ type: String }],
  },
  { timestamps: true }
);

// Index to support future geospatial queries (2dsphere requires GeoJSON field;
// for now we keep lat/lng flat and compute Haversine in the service layer,
// as documented in docs/ARCHITECTURE.md).
ChargingStationSchema.index({ latitude: 1, longitude: 1 });

export default model<IChargingStation>('ChargingStation', ChargingStationSchema);
