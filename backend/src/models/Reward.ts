import { Schema, model, Document, Types } from 'mongoose';

export interface IReward extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  points: number;
  reason: string;
  transactionType: 'EARNED' | 'REDEEMED';
  createdAt: Date;
}

const RewardSchema = new Schema<IReward>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    points: { type: Number, required: true },
    reason: { type: String, required: true },
    transactionType: { type: String, enum: ['EARNED', 'REDEEMED'], default: 'EARNED' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<IReward>('Reward', RewardSchema);
