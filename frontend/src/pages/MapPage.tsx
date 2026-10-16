import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { api, unwrapError } from '../api/client';
import { Station } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

// Leaflet's default marker icons reference image files that don't resolve
// correctly under Vite's bundler by default — reset them to CDN-hosted
// assets so pins render correctly (a well-known Leaflet+bundler quirk).
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const availableIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MUMBAI_CENTER: [number, number] = [19.076, 72.8777];

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapPage() {
  usePageTitle('Map');
  const [stations, setStations] = useState<Station[]>([]);
  const [center, setCenter] = useState<[number, number]>(MUMBAI_CENTER);
  const [error, setError] = useState<string | null>(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    api
      .get('/stations/nearby', { params: { lat: center[0], lng: center[1], radiusKm: 25 } })
      .then((res) => setStations(res.data.data))
      .catch((err) => setError(unwrapError(err)));
  }, [center]);

  // Jump to any place in India via OpenStreetMap's open Nominatim geocoder.
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!placeQuery.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(placeQuery)}`
      );
      const results = await res.json();
      if (!results.length) {
        setError(`Couldn't find "${placeQuery}" in India.`);
        return;
      }
      setCenter([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
    } catch {
      setError('Location search failed — check your connection and try again.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col relative">
      <form
        onSubmit={handleSearch}
        className="absolute z-[1000] top-3 left-1/2 -translate-x-1/2 w-[90%] max-w-md flex gap-2"
      >
        <input
          className="input shadow-lg bg-white"
          placeholder="Jump to any city/area in India (e.g. Kochi, Chandigarh...)"
          value={placeQuery}
          onChange={(e) => setPlaceQuery(e.target.value)}
        />
        <button className="btn-primary shadow-lg whitespace-nowrap" type="submit" disabled={searching}>
          {searching ? '...' : 'Go'}
        </button>
      </form>
      {error && <p className="text-red-600 text-sm p-2 pt-14">{error}</p>}
      <div className="flex-1">
        <MapContainer center={center} zoom={12} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter center={center} />
          <Marker position={center}>
            <Popup>You are here (approx.)</Popup>
          </Marker>
          {stations.map((s) => (
            <Marker key={s._id} position={[s.latitude, s.longitude]} icon={availableIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.address}</p>
                  <p className="text-xs mt-1">
                    {s.availableChargers}/{s.totalChargers} available · ₹{s.pricePerKWh}/kWh
                  </p>
                  <Link to={`/stations/${s._id}`} className="text-brand-600 text-xs font-medium">
                    View details →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
