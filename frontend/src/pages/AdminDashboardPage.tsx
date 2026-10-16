import { useEffect, useState } from 'react';
import { api, unwrapError } from '../api/client';
import { usePageTitle } from '../hooks/usePageTitle';

interface Overview {
  totalUsers: number;
  activeStations: number;
  availableChargers: number;
  activeSessions: number;
  todaysBookings: number;
  todaysRevenue: number;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  authProvider: string;
  verified: boolean;
}

interface AdminStation {
  _id: string;
  name: string;
  city: string;
  status: string;
  totalChargers: number;
  availableChargers: number;
}

interface AdminCharger {
  _id: string;
  chargerCode: string;
  stationId: string;
  connectorType: string;
  powerKW: number;
  status: string;
}

interface AdminBooking {
  _id: string;
  userId: string;
  stationId: string;
  startTime: string;
  durationMinutes: number;
  status: string;
  paymentStatus: string;
}

type AdminSection = 'users' | 'stations' | 'chargers' | 'bookings';

function buildBookingChartData(rows: Array<{ _id: string; count: number }>) {
  const counts = new Map(rows.map((row) => [row._id, row.count]));
  const result: Array<{ date: string; label: string; count: number }> = [];
  const today = new Date();

  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - offset);
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    result.push({
      date: key,
      label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: counts.get(key) ?? 0,
    });
  }
  return result;
}

const CARD_DEFS: Array<{ key: keyof Overview; label: string; prefix?: string }> = [
  { key: 'totalUsers', label: 'Total Users' },
  { key: 'activeStations', label: 'Active Stations' },
  { key: 'availableChargers', label: 'Available Chargers' },
  { key: 'activeSessions', label: 'Active Sessions' },
  { key: 'todaysBookings', label: "Today's Bookings" },
  { key: 'todaysRevenue', label: "Today's Revenue", prefix: '₹' },
];

export default function AdminDashboardPage() {
  usePageTitle('Admin Overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [chargerStatus, setChargerStatus] = useState<Array<{ _id: string; count: number }>>([]);
  const [bookingsByDay, setBookingsByDay] = useState<Array<{ _id: string; count: number }>>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stations, setStations] = useState<AdminStation[]>([]);
  const [chargers, setChargers] = useState<AdminCharger[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [section, setSection] = useState<AdminSection>('users');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics/overview'),
      api.get('/admin/analytics/charger-status'),
      api.get('/admin/analytics/bookings-by-day'),
      api.get('/admin/users'),
      api.get('/admin/stations'),
      api.get('/admin/chargers'),
      api.get('/admin/bookings'),
    ])
      .then(([overviewRes, statusRes, daysRes, usersRes, stationsRes, chargersRes, bookingsRes]) => {
        setOverview(overviewRes.data.data);
        setChargerStatus(statusRes.data.data);
        setBookingsByDay(daysRes.data.data);
        setUsers(usersRes.data.data);
        setStations(stationsRes.data.data);
        setChargers(chargersRes.data.data);
        setBookings(bookingsRes.data.data);
      })
      .catch((err) => setError(unwrapError(err)));
  }, []);

  const bookingChart = buildBookingChartData(bookingsByDay);
  const maxBookings = Math.max(1, ...bookingChart.map((b) => b.count));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">Admin Overview</h1>
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {CARD_DEFS.map((c) => (
          <div key={c.key} className="card text-center">
            <p className="text-2xl font-bold text-brand-700">
              {overview ? `${c.prefix ?? ''}${overview[c.key]}` : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Bookings by day</h2>
          <div className="flex items-end gap-1 h-40 border-b border-slate-200 px-1">
            {bookingChart.map((b) => (
              <div key={b.date} className="group flex h-full flex-1 flex-col items-center justify-end" title={`${b.label}: ${b.count} booking(s)`}>
                <div
                  className="w-full rounded-t bg-brand-400 transition-all group-hover:bg-brand-600"
                  style={{ height: `${Math.max((b.count / maxBookings) * 100, b.count > 0 ? 8 : 2)}%` }}
                />
                <span className="mt-2 text-[10px] text-slate-400 [writing-mode:vertical-rl] sm:[writing-mode:horizontal-tb]">{b.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {bookingsByDay.reduce((total, booking) => total + booking.count, 0)} bookings in the last 14 days
          </p>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Charger status breakdown</h2>
          <div className="flex flex-col gap-2">
            {chargerStatus.map((s) => (
              <div key={s._id} className="flex items-center justify-between text-sm">
                <span>{s._id}</span>
                <span className="badge bg-slate-100">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold">Management</h2>
            <p className="text-sm text-slate-500">View users, stations, chargers, and bookings.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {([
              ['users', `Users (${users.length})`],
              ['stations', `Stations (${stations.length})`],
              ['chargers', `Chargers (${chargers.length})`],
              ['bookings', `Bookings (${bookings.length})`],
            ] as Array<[AdminSection, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={section === value ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
                onClick={() => setSection(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {section === 'users' && (
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-2">Name</th><th>Email</th><th>Role</th><th>Provider</th><th>Verified</th></tr></thead>
              <tbody>{users.map((u) => <tr key={u._id} className="border-b border-slate-100"><td className="py-3 font-medium">{u.name}</td><td>{u.email}</td><td><span className="badge bg-slate-100">{u.role}</span></td><td>{u.authProvider}</td><td>{u.verified ? 'Yes' : 'No'}</td></tr>)}</tbody>
            </table>
          )}
          {section === 'stations' && (
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-2">Station</th><th>City</th><th>Status</th><th>Chargers</th><th>Available</th></tr></thead>
              <tbody>{stations.map((s) => <tr key={s._id} className="border-b border-slate-100"><td className="py-3 font-medium">{s.name}</td><td>{s.city}</td><td><span className="badge bg-emerald-50 text-emerald-700">{s.status}</span></td><td>{s.totalChargers}</td><td>{s.availableChargers}</td></tr>)}</tbody>
            </table>
          )}
          {section === 'chargers' && (
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-2">Code</th><th>Connector</th><th>Power</th><th>Status</th><th>Station ID</th></tr></thead>
              <tbody>{chargers.map((c) => <tr key={c._id} className="border-b border-slate-100"><td className="py-3 font-medium">{c.chargerCode}</td><td>{c.connectorType}</td><td>{c.powerKW} kW</td><td><span className="badge bg-slate-100">{c.status}</span></td><td className="font-mono text-xs">{c.stationId}</td></tr>)}</tbody>
            </table>
          )}
          {section === 'bookings' && (
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-2">Booking ID</th><th>Start time</th><th>Duration</th><th>Status</th><th>Payment</th><th>User ID</th></tr></thead>
              <tbody>{bookings.map((b) => <tr key={b._id} className="border-b border-slate-100"><td className="py-3 font-mono text-xs">{b._id}</td><td>{new Date(b.startTime).toLocaleString()}</td><td>{b.durationMinutes} min</td><td><span className="badge bg-slate-100">{b.status}</span></td><td>{b.paymentStatus}</td><td className="font-mono text-xs">{b.userId}</td></tr>)}</tbody>
            </table>
          )}
          {((section === 'users' && users.length === 0) || (section === 'stations' && stations.length === 0) || (section === 'chargers' && chargers.length === 0) || (section === 'bookings' && bookings.length === 0)) && (
            <p className="py-6 text-sm text-slate-500">No records found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
