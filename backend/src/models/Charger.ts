import { Schema, model, Document, Types } from 'mongoose';

export type ChargerStatus =
  | 'AVAILABLE'
  | 'PREPARING'
  | 'CHARGING'
  | 'SUSPENDED'
  | 'FINISHING'
  | 'FAULTED'
  | 'UNAVAILABLE'
  | 'OFFLINE';

export interface ICharger extends Document {
  _id: Types.ObjectId;
  stationId: Types.ObjectId;
  chargerCode: string;
  connectorType: string;
  powerKW: number;
  chargingType: 'AC' | 'DC';
  status: ChargerStatus;
  currentSessionId?: Types.ObjectId | null;
  lastHeartbeat: Date;
  ocppStatus: string;
  maintenanceStatus: 'NORMAL' | 'WARNING' | 'MAINTENANCE' | 'FAULT';
}

const ChargerSchema = new Schema<ICharger>(
  {
    stationId: { type: Schema.Types.ObjectId, ref: 'ChargingStation', required: true, index: true },
    chargerCode: { type: String, required: true },
    connectorType: {
      type: String,
      enum: ['CCS2', 'CHAdeMO', 'Type2', 'GB/T', 'Bharat AC001', 'Bharat DC001'],
      required: true,
    },
    powerKW: { type: Number, required: true },
    chargingType: { type: String, enum: ['AC', 'DC'], required: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'PREPARING', 'CHARGING', 'SUSPENDED', 'FINISHING', 'FAULTED', 'UNAVAILABLE', 'OFFLINE'],
      default: 'AVAILABLE',
    },
    currentSessionId: { type: Schema.Types.ObjectId, ref: 'ChargingSession', default: null },
    lastHeartbeat: { type: Date, default: Date.now },
    ocppStatus: { type: String, default: 'Available' },
    maintenanceStatus: { type: String, enum: ['NORMAL', 'WARNING', 'MAINTENANCE', 'FAULT'], default: 'NORMAL' },
  },
  { timestamps: true }
);

export default model<ICharger>('Charger', ChargerSchema);
