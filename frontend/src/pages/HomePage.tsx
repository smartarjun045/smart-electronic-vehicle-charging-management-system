import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, unwrapError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Station, RecommendedStation } from '../types';
import StationCard from '../components/StationCard';
import { usePageTitle } from '../hooks/usePageTitle';

// Fallback location if the browser denies/lacks geolocation and the user
// hasn't searched a place yet: Bandra Kurla Complex, Mumbai. EVSync itself
// is NOT limited to Mumbai — nearby search runs against whatever
// coordinates are active, anywhere in India (or beyond, given station data).
const DEFAULT_LOCATION = { lat: 19.0656, lng: 72.8678, label: 'Bandra Kurla Complex, Mumbai (default)' };

export default function HomePage() {
  usePageTitle('Find EV Charging Near You');
  const { user } = useAuth();
  const [coords, setCoords] = useState(DEFAULT_LOCATION);
  const [usingDefault, setUsingDefault] = useState(true);
  const [stations, setStations] = useState<Station[]>([]);
  const [recommended, setRecommended] = useState<RecommendedStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported in this browser.');
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const accuracy = Math.round(pos.coords.accuracy);
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: `Your current location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}, ±${accuracy}m)`,
        });
        setUsingDefault(false);
        setLocating(false);
      },
      (error) => {
        console.warn('[location] geolocation failed', { code: error.code, message: error.message });
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Location permission denied. Allow location access for localhost, then try again.'
            : error.code === error.TIMEOUT
              ? 'Location request timed out. Turn on Windows Location Services and allow browser location access, then try again.'
              : 'Unable to read your location. Try searching a city/area below instead.';
        setLocateError(message);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
    );
  }

  // Request a cached/network location once on first load. The explicit button
  // remains available when the browser needs a fresh permission prompt.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: `Your current location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`,
        });
        setUsingDefault(false);
      },
      (error) => console.warn('[location] automatic lookup failed', { code: error.code, message: error.message }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Real geocoding via OpenStreetMap's Nominatim (open, no API key) so a
  // user can search ANY place in India — not just a fixed city list.
  async function handlePlaceSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!placeQuery.trim()) return;
    setLocating(true);
    setLocateError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(placeQuery)}`
      );
      const results = await res.json();
      if (!results.length) {
        setLocateError(`Couldn't find "${placeQuery}" in India. Try a different city or area name.`);
        return;
      }
      setCoords({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon), label: results[0].display_name });
      setUsingDefault(false);
    } catch {
      setLocateError('Location search failed — check your connection and try again.');
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/stations/nearby', { params: { lat: coords.lat, lng: coords.lng, radiusKm: 20 } }),
      api.get('/recommendations', { params: { lat: coords.lat, lng: coords.lng, radiusKm: 20 } }),
    ])
      .then(([stRes, recRes]) => {
        if (cancelled) return;
        setStations(stRes.data.data);
        setRecommended(recRes.data.data.slice(0, 3));
      })
      .catch((err) => !cancelled && setError(unwrapError(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [coords]);

  const filtered = search
    ? stations.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()))
    : stations;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-50 via-white to-sky-50 border border-slate-100 px-6 sm:px-10 py-12 sm:py-16 mb-10 text-center">
        <div className="blob w-72 h-72 bg-brand-300 -top-16 -left-16" />
        <div className="blob w-72 h-72 bg-sky-300 -bottom-20 -right-10" />
        <div className="charging-scene" aria-hidden="true">
          <div className="scene-horizon" />
          <div className="scene-road">
            <span /><span /><span /><span />
          </div>
          <div className="charging-station">
            <div className="station-glow" />
            <div className="station-pole">
              <span className="station-bolt">⚡</span>
            </div>
            <div className="station-base" />
            <div className="charging-cable" />
          </div>
          <div className="ev-car">
            <div className="car-shadow" />
            <div className="car-body">
              <span className="car-window front" />
              <span className="car-window rear" />
              <span className="car-light" />
            </div>
            <span className="car-wheel left" />
            <span className="car-wheel right" />
          </div>
        </div>
        <div className="relative z-10">
          <span className="badge bg-white text-brand-700 border border-brand-100 shadow-sm mb-4">
            ⚡ Now covering stations across India
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Charge your EV, <span className="text-brand-600 underline decoration-wavy hero-underline">anywhere</span>
          </h1>
          <p className="text-slate-500 mt-4 max-w-xl mx-auto">
            Find nearby chargers, book a slot in seconds, and watch your charging session live — from Mumbai to
            Kochi to Jaipur.
          </p>
          <p className="text-slate-500 text-sm mt-5">
            📍 {coords.label} {usingDefault && '— showing the default location. Locate yourself or search a place below.'}
          </p>
          <button
            className="btn-primary mt-6"
            onClick={() => {
              useBrowserLocation();
              document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            📍 Find charging near me
          </button>
        </div>
      </div>

      <div className="grid gap-4 mb-10 sm:grid-cols-3">
        <div className="card hoverable text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl">🗺️</div>
          <h3 className="font-display font-bold">Find nearby stations</h3>
          <p className="text-slate-500 text-sm mt-1">Live map, real filters, distance sorted.</p>
        </div>
        <div className="card hoverable text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-xl">📅</div>
          <h3 className="font-display font-bold">Book in seconds</h3>
          <p className="text-slate-500 text-sm mt-1">Pick a slot, get a QR — no double-booking.</p>
        </div>
        <div className="card hoverable text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl">⚡</div>
          <h3 className="font-display font-bold">Watch it charge, live</h3>
          <p className="text-slate-500 text-sm mt-1">Real-time battery, energy & cost updates.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-3 lg:flex-row">
        <form onSubmit={handlePlaceSearch} className="flex min-w-0 flex-1 gap-2">
          <input
            className="input min-w-0"
            placeholder="Search any city or area in India (e.g. Jaipur, Whitefield Bengaluru...)"
            value={placeQuery}
            onChange={(e) => setPlaceQuery(e.target.value)}
          />
          <button className="btn-secondary shrink-0 whitespace-nowrap" type="submit" disabled={locating}>
            {locating ? 'Locating...' : 'Locate'}
          </button>
        </form>
        <button className="btn-primary shrink-0 whitespace-nowrap" onClick={useBrowserLocation} disabled={locating}>
          📍 Use my current location
        </button>
      </div>
      {locateError && (
        <p className="text-amber-600 text-xs mb-3" role="alert">
          {locateError} You can search a city or area instead.
        </p>
      )}

      <div className="flex flex-col gap-3 mb-6 sm:flex-row">
        <input
          className="input"
          placeholder="Filter results by station name or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link to="/map" className="btn-secondary whitespace-nowrap">View Map</Link>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {recommended.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="section-kicker">Smart picks</p>
              <h2 className="text-lg font-semibold">Recommended for you</h2>
            </div>
            <span className="hidden text-xs text-slate-400 sm:block">Ranked by distance, speed & availability</span>
          </div>
          <div className="grid items-stretch gap-4 sm:grid-cols-3">
            {recommended.map((r) => (
              <div key={r.stationId} className="card hoverable flex h-full flex-col">
                <div className="flex justify-between items-start">
                  <h3 className="pr-3 font-semibold leading-snug">{r.name}</h3>
                  <span className="badge bg-brand-50 text-brand-700">Score {(r.score * 100).toFixed(0)}</span>
                </div>
                <ul className="mt-3 min-h-[5.5rem] list-disc list-inside space-y-1 text-xs leading-relaxed text-slate-500">
                  {r.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
                <Link to={`/stations/${r.stationId}`} className="btn-primary mt-auto w-full text-center text-sm">
                  View station
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 id="results" className="text-lg font-semibold mb-3 scroll-mt-20">
        Nearby stations {!loading && `(${filtered.length})`}
      </h2>
      {loading ? (
        <p className="text-slate-500 text-sm">Loading stations...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 text-sm">
          {usingDefault
            ? 'No stations found at the default location. Locate yourself or search a city/area to find nearby stations.'
            : 'No stations found within 20 km of your detected location. Try searching a nearby city or use the map.'}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <StationCard key={s._id} station={s} />
          ))}
        </div>
      )}

      {!user && (
        <div className="card mt-8 text-center">
          <p className="text-slate-600">Sign up to book a slot, check in with QR, and track your charging sessions live.</p>
          <Link to="/register" className="btn-primary inline-block mt-3">Create free account</Link>
        </div>
      )}
    </div>
  );
}
