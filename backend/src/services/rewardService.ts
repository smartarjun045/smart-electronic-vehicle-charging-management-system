import Reward from '../models/Reward';
import User from '../models/User';

export async function awardPoints(userId: string, points: number, reason: string) {
  await Reward.create({ userId, points, reason, transactionType: 'EARNED' });
  await User.findByIdAndUpdate(userId, { $inc: { greenPoints: points } });
}

export async function getRewardHistory(userId: string) {
  return Reward.find({ userId }).sort({ createdAt: -1 }).lean();
}
