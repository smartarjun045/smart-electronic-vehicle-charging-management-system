import { Schema, model, Document, Types } from 'mongoose';

export interface IVehicle extends Omit<Document, 'model'> {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  manufacturer: string;
  model: string;
  batteryCapacityKWh: number;
  currentBatteryPercentage: number;
  connectorType: string;
  registrationNumber: string;
  chargingSpeedKW: number;
  efficiencyKmPerKWh: number;
  createdAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    batteryCapacityKWh: { type: Number, required: true },
    currentBatteryPercentage: { type: Number, default: 50, min: 0, max: 100 },
    connectorType: {
      type: String,
      enum: ['CCS2', 'CHAdeMO', 'Type2', 'GB/T', 'Bharat AC001', 'Bharat DC001'],
      required: true,
    },
    registrationNumber: { type: String, required: true },
    chargingSpeedKW: { type: Number, default: 7 },
    efficiencyKmPerKWh: { type: Number, default: 6.5 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<IVehicle>('Vehicle', VehicleSchema);
