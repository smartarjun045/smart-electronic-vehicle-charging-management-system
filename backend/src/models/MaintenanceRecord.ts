import { Schema, model, Document, Types } from 'mongoose';

export interface IMaintenanceRecord extends Document {
  _id: Types.ObjectId;
  chargerId: Types.ObjectId;
  issue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: Date;
  resolvedAt?: Date;
}

const MaintenanceRecordSchema = new Schema<IMaintenanceRecord>(
  {
    chargerId: { type: Schema.Types.ObjectId, ref: 'Charger', required: true, index: true },
    issue: { type: String, required: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    description: { type: String, default: '' },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
    resolvedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<IMaintenanceRecord>('MaintenanceRecord', MaintenanceRecordSchema);
