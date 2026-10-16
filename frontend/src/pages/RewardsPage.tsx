import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface RewardEntry {
  _id: string;
  points: number;
  reason: string;
  transactionType: string;
  createdAt: string;
}

export default function RewardsPage() {
  const { user, refreshMe } = useAuth();
  const [rewards, setRewards] = useState<RewardEntry[]>([]);

  useEffect(() => {
    void refreshMe();
    api.get('/rewards').then((res) => setRewards(res.data.data));
  }, [refreshMe]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-1">Green Points</h1>
      <p className="text-slate-500 text-sm mb-4">Earn points every time you complete a charging session.</p>

      <div className="card mb-6 text-center">
        <p className="text-4xl font-bold text-brand-600">{user?.greenPoints ?? 0}</p>
        <p className="text-slate-500 text-sm">total points</p>
      </div>

      <h2 className="font-semibold mb-2">History</h2>
      {rewards.length === 0 ? (
        <p className="text-slate-500 text-sm">No reward activity yet — complete a charging session to earn points.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rewards.map((r) => (
            <div key={r._id} className="card flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{r.reason}</p>
                <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <span className="badge bg-brand-50 text-brand-700">+{r.points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
