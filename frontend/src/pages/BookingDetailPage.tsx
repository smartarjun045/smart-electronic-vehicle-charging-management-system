import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, unwrapError } from '../api/client';
import { Booking } from '../types';

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api.get(`/bookings/${id}`).then((res) => setBooking(res.data.data));
  }, [id]);

  async function handleCheckIn() {
    if (!booking) return;
    setCheckingIn(true);
    setError(null);
    try {
      const res = await api.post('/bookings/check-in', { qrToken: booking.qrToken });
      setBooking(res.data.data);
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleStartCharging() {
    if (!booking) return;
    setStarting(true);
    setError(null);
    try {
      const res = await api.post('/sessions/start', { bookingId: booking._id });
      navigate(`/charging/${res.data.data._id}`);
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setStarting(false);
    }
  }

  if (!booking) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="card">
        <h1 className="font-bold text-lg mb-1">Booking #{booking._id.slice(-6)}</h1>
        <p className="text-sm text-slate-500">
          {new Date(booking.startTime).toLocaleString()} · {booking.durationMinutes} min
        </p>
        <span className="badge bg-slate-100 mt-2 inline-block">{booking.status}</span>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

        <div className="mt-4 flex flex-col gap-2">
          {booking.status === 'CONFIRMED' && (
            <button className="btn-primary" onClick={handleCheckIn} disabled={checkingIn}>
              {checkingIn ? 'Checking in...' : 'Simulate QR check-in (arrive at station)'}
            </button>
          )}
          {booking.status === 'ACTIVE' && (
            <button className="btn-primary" onClick={handleStartCharging} disabled={starting}>
              {starting ? 'Starting...' : 'Start charging session'}
            </button>
          )}
          {booking.status === 'COMPLETED' && (
            <button className="btn-secondary" onClick={() => navigate('/invoices')}>
              View invoice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
