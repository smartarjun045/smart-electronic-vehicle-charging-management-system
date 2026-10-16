import { Schema, model, Document, Types } from 'mongoose';

export interface IMeterReading {
  timestamp: Date;
  batteryPercentage: number;
  energyConsumedKWh: number;
  powerKW: number;
}

export interface IChargingSession extends Document {
  _id: Types.ObjectId;
  bookingId: Types.ObjectId;
  userId: Types.ObjectId;
  chargerId: Types.ObjectId;
  startedAt?: Date;
  endedAt?: Date;
  initialBatteryPercentage: number;
  finalBatteryPercentage: number;
  energyConsumedKWh: number;
  chargingPowerKW: number;
  cost: number;
  status: 'NOT_STARTED' | 'CHARGING' | 'SUSPENDED' | 'COMPLETED' | 'FAULTED';
  meterValues: IMeterReading[];
}

const ChargingSessionSchema = new Schema<IChargingSession>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chargerId: { type: Schema.Types.ObjectId, ref: 'Charger', required: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    initialBatteryPercentage: { type: Number, required: true },
    finalBatteryPercentage: { type: Number, default: 0 },
    energyConsumedKWh: { type: Number, default: 0 },
    chargingPowerKW: { type: Number, required: true },
    cost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'CHARGING', 'SUSPENDED', 'COMPLETED', 'FAULTED'],
      default: 'NOT_STARTED',
    },
    meterValues: [
      {
        timestamp: { type: Date, default: Date.now },
        batteryPercentage: Number,
        energyConsumedKWh: Number,
        powerKW: Number,
      },
    ],
  },
  { timestamps: true }
);

export default model<IChargingSession>('ChargingSession', ChargingSessionSchema);
