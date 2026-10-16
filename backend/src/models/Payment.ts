import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  _id: Types.ObjectId;
  bookingId: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  breakdown: {
    energyCost: number;
    parkingFee: number;
    bookingFee: number;
  };
  paidAt?: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentMethod: { type: String, default: 'SIMULATED_WALLET' },
    transactionId: { type: String, required: true, unique: true },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'SUCCESS' },
    breakdown: {
      energyCost: { type: Number, default: 0 },
      parkingFee: { type: Number, default: 0 },
      bookingFee: { type: Number, default: 0 },
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default model<IPayment>('Payment', PaymentSchema);
