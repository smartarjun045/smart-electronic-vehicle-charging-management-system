import { Schema, model, Document, Types } from 'mongoose';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW';

export interface IBooking extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  stationId: Types.ObjectId;
  chargerId: Types.ObjectId;
  vehicleId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  status: BookingStatus;
  qrToken: string;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stationId: { type: Schema.Types.ObjectId, ref: 'ChargingStation', required: true, index: true },
    chargerId: { type: Schema.Types.ObjectId, ref: 'Charger', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'NO_SHOW'],
      default: 'CONFIRMED',
      index: true,
    },
    qrToken: { type: String, required: true, unique: true },
    paymentStatus: { type: String, enum: ['UNPAID', 'PAID', 'REFUNDED'], default: 'UNPAID' },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Speeds up the overlap-conflict query used by the booking engine.
BookingSchema.index({ chargerId: 1, status: 1, startTime: 1, endTime: 1 });

export default model<IBooking>('Booking', BookingSchema);
