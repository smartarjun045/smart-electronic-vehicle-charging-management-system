import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, unwrapError } from '../api/client';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import { ChargingSession } from '../types';

export default function ChargingSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { refreshMe } = useAuth();
  const socketRef = useSocket();
  const [session, setSession] = useState<ChargingSession | null>(null);
  const [live, setLive] = useState<{ batteryPercentage: number; energyConsumedKWh: number; cost: number; powerKW: number } | null>(null);
  const [completedInfo, setCompletedInfo] = useState<{ rewardPoints: number; invoiceId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    api
      .get(`/sessions/${sessionId}`)
      .then((res) => setSession(res.data.data))
      .catch((err) => setError(unwrapError(err)));
  }, [sessionId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    function onProgress(payload: any) {
      if (payload.sessionId !== sessionId) return;
      setLive(payload);
    }
    function onCompleted(payload: any) {
      if (payload.sessionId !== sessionId) return;
      void refreshMe();
      setCompletedInfo({ rewardPoints: payload.rewardPoints, invoiceId: payload.invoiceId });
      setLive({
        batteryPercentage: payload.finalBatteryPercentage,
        energyConsumedKWh: payload.energyConsumedKWh,
        cost: payload.cost,
        powerKW: 0,
      });
    }

    socket.on('charging:progress', onProgress);
    socket.on('charging:completed', onCompleted);
    return () => {
      socket.off('charging:progress', onProgress);
      socket.off('charging:completed', onCompleted);
    };
  }, [refreshMe, socketRef, sessionId]);

  async function handleStop() {
    if (!sessionId) return;
    setStopping(true);
    try {
      await api.post(`/sessions/${sessionId}/stop`);
      await refreshMe();
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setStopping(false);
    }
  }

  if (!session) return <div className="p-8 text-center text-slate-500">Loading session...</div>;

  const pct = live?.batteryPercentage ?? session.finalBatteryPercentage ?? session.initialBatteryPercentage;
  const energy = live?.energyConsumedKWh ?? session.energyConsumedKWh;
  const cost = live?.cost ?? session.cost;
  const power = live?.powerKW ?? session.chargingPowerKW;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="card text-center">
        <h1 className="font-bold text-lg mb-4">Charging in progress</h1>

        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path
              className="text-slate-200"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-brand-500 transition-all duration-700"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${pct}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-2xl font-bold">{Math.round(pct)}%</span>
            <span className="text-xs text-slate-500">battery</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-left">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-500 text-xs">Energy consumed</p>
            <p className="font-semibold">{energy.toFixed(2)} kWh</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-500 text-xs">Current cost</p>
            <p className="font-semibold">₹{cost.toFixed(2)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-500 text-xs">Charging power</p>
            <p className="font-semibold">{power.toFixed(1)} kW</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-500 text-xs">Status</p>
            <p className="font-semibold">{completedInfo ? 'Completed' : session.status}</p>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        {completedInfo ? (
          <div className="mt-5">
            <p className="text-brand-700 font-medium">🎉 You earned {completedInfo.rewardPoints} green points!</p>
            <button className="btn-primary mt-3" onClick={() => navigate('/invoices')}>
              View invoice
            </button>
          </div>
        ) : (
          <button className="btn-secondary mt-5 w-full" onClick={handleStop} disabled={stopping}>
            {stopping ? 'Stopping...' : 'Stop charging & finish'}
          </button>
        )}

        <p className="text-xs text-slate-500 mt-4">
          Live values are simulated for this academic demo — see LIMITATIONS.md.
        </p>
      </div>
    </div>
  );
}
