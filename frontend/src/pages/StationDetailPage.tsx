import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api, unwrapError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Station, Charger, Vehicle } from '../types';

function toLocalDateTimeValue(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export default function StationDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [station, setStation] = useState<Station | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedCharger, setSelectedCharger] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ qrDataUrl: string; bookingId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(searchParams.get('book') === '1');
  const minimumStartTime = toLocalDateTimeValue(new Date());

  useEffect(() => {
    api.get(`/stations/${id}`).then((res) => {
      setStation(res.data.data.station);
      setChargers(res.data.data.chargers);
    });
  }, [id]);

  useEffect(() => {
    if (user) {
      api.get('/vehicles').then((res) => setVehicles(res.data.data));
    }
  }, [user]);

  useEffect(() => {
    setStartTime(toLocalDateTimeValue(new Date(Date.now() + 10 * 60000)));
  }, []);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCharger || !selectedVehicle) {
      setError('Please select a charger and a vehicle.');
      return;
    }
    const selectedStart = new Date(startTime);
    if (!startTime || Number.isNaN(selectedStart.getTime()) || selectedStart.getTime() <= Date.now()) {
      setError('Choose a start time in the future.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/bookings', {
        stationId: id,
        chargerId: selectedCharger,
        vehicleId: selectedVehicle,
        startTime: new Date(startTime).toISOString(),
        durationMinutes: duration,
      });
      setSuccess({ qrDataUrl: res.data.data.qrDataUrl, bookingId: res.data.data.booking._id });
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!station) return <div className="p-8 text-center text-slate-500">Loading station...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="card mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">{station.name}</h1>
            <p className="text-sm text-slate-500">{station.address}</p>
            <p className="text-xs text-slate-500 mt-1">Operated by {station.operator}</p>
          </div>
          <span className="badge bg-amber-50 text-amber-700">★ {station.rating.toFixed(1)}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600 mt-3">
          <span className="badge bg-slate-100">{station.openingHours}</span>
          <span className="badge bg-slate-100">₹{station.pricePerKWh}/kWh</span>
          <span className="badge bg-slate-100">Parking ₹{station.parkingFee}</span>
          {station.renewableEnergy && <span className="badge bg-emerald-50 text-emerald-700">🌱 Renewable</span>}
          {station.amenities.map((a) => (
            <span key={a} className="badge bg-slate-100">{a}</span>
          ))}
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold mb-3">Chargers</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {chargers.map((c) => (
            <div key={c._id} className="border border-slate-200 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{c.chargerCode}</p>
                <p className="text-xs text-slate-500">{c.connectorType} · {c.chargingType} · {c.powerKW}kW</p>
              </div>
              <span
                className={`badge ${
                  c.status === 'AVAILABLE' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!user ? (
        <div className="card text-center">
          <p className="text-slate-600 mb-2">Log in to book a charging slot at this station.</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>Log in</button>
        </div>
      ) : success ? (
        <div className="card text-center">
          <h2 className="font-semibold mb-2">Booking confirmed 🎉</h2>
          <img src={success.qrDataUrl} alt="Booking QR code" className="mx-auto w-48 h-48" />
          <p className="text-sm text-slate-500 mt-2">Show this QR code at the station to check in.</p>
          <button className="btn-primary mt-4" onClick={() => navigate(`/bookings/${success.bookingId}`)}>
            View booking
          </button>
        </div>
      ) : showBookingForm ? (
        <form onSubmit={handleBook} className="card flex flex-col gap-3">
          <h2 className="font-semibold">Book a slot</h2>
          {vehicles.length === 0 ? (
            <p className="text-sm text-amber-600">
              You need a saved vehicle before booking.{' '}
              <button type="button" className="underline" onClick={() => navigate('/vehicle')}>
                Add one now
              </button>
            </p>
          ) : (
            <>
              <label className="text-sm">
                Charger
                <select className="input mt-1" value={selectedCharger} onChange={(e) => setSelectedCharger(e.target.value)} required>
                  <option value="">Select a charger</option>
                  {chargers
                    .filter((c) => c.status === 'AVAILABLE')
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.chargerCode} — {c.connectorType} ({c.powerKW}kW)
                      </option>
                    ))}
                </select>
              </label>
              <label className="text-sm">
                Vehicle
                <select className="input mt-1" value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} required>
                  <option value="">Select a vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.manufacturer} {v.model} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Start time
                <input
                  type="datetime-local"
                  className="input mt-1"
                  value={startTime}
                  min={minimumStartTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </label>
              <label className="text-sm">
                Duration (minutes)
                <select className="input mt-1" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  {[15, 30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>
                      {d} minutes
                    </option>
                  ))}
                </select>
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button className="btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Booking...' : 'Confirm booking'}
              </button>
            </>
          )}
        </form>
      ) : (
        <button className="btn-primary w-full" onClick={() => setShowBookingForm(true)}>
          Book a slot at this station
        </button>
      )}
    </div>
  );
}
