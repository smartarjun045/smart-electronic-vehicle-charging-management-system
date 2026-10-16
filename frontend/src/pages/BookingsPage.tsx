import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, unwrapError } from '../api/client';
import { Booking } from '../types';

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-blue-50 text-blue-700',
  ACTIVE: 'bg-brand-50 text-brand-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-red-50 text-red-600',
  EXPIRED: 'bg-red-50 text-red-600',
  PENDING: 'bg-amber-50 text-amber-700',
  NO_SHOW: 'bg-red-50 text-red-600',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/bookings')
      .then((res) => setBookings(res.data.data))
      .catch((err) => setError(unwrapError(err)))
      .finally(() => setLoading(false));
  }, []);

  async function cancelBooking(id: string) {
    try {
      await api.patch(`/bookings/${id}/cancel`);
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: 'CANCELLED' } : b)));
    } catch (err) {
      setError(unwrapError(err));
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">My bookings</h1>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="text-slate-500 text-sm">
          No bookings yet. <Link to="/map" className="text-brand-600 font-medium">Find a station</Link>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((b) => (
            <div key={b._id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">
                  {new Date(b.startTime).toLocaleString()} · {b.durationMinutes} min
                </p>
                <p className="text-xs text-slate-500">Booking #{b._id.slice(-6)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${STATUS_COLORS[b.status] || 'bg-slate-100'}`}>{b.status}</span>
                <Link to={`/bookings/${b._id}`} className="btn-secondary text-sm">
                  Details
                </Link>
                {(b.status === 'CONFIRMED' || b.status === 'PENDING') && (
                  <button className="text-red-600 text-xs font-medium" onClick={() => cancelBooking(b._id)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
