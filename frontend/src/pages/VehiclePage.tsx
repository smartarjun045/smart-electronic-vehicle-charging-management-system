import React, { useEffect, useState } from 'react';
import { api, unwrapError } from '../api/client';
import { Vehicle } from '../types';

const CONNECTORS = ['CCS2', 'CHAdeMO', 'Type2', 'GB/T', 'Bharat AC001', 'Bharat DC001'];

export default function VehiclePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    manufacturer: '',
    model: '',
    batteryCapacityKWh: 40,
    currentBatteryPercentage: 50,
    connectorType: 'CCS2',
    registrationNumber: '',
    chargingSpeedKW: 30,
  });
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.get('/vehicles').then((res) => setVehicles(res.data.data));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/vehicles', form);
      load();
      setForm({ ...form, manufacturer: '', model: '', registrationNumber: '' });
    } catch (err) {
      setError(unwrapError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/vehicles/${id}`);
    load();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 grid md:grid-cols-2 gap-6">
      <div>
        <h1 className="text-xl font-bold mb-4">My vehicles</h1>
        {vehicles.length === 0 && <p className="text-slate-500 text-sm">No vehicles saved yet.</p>}
        <div className="flex flex-col gap-3">
          {vehicles.map((v) => (
            <div key={v._id} className="card flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">
                  {v.manufacturer} {v.model}
                </p>
                <p className="text-xs text-slate-500">
                  {v.registrationNumber} · {v.connectorType} · {v.batteryCapacityKWh}kWh
                </p>
                <p className="text-xs text-brand-600">Battery: {v.currentBatteryPercentage}%</p>
              </div>
              <button className="text-red-600 text-xs font-medium" onClick={() => handleDelete(v._id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Add a vehicle</h2>
        <form onSubmit={handleSubmit} className="card flex flex-col gap-3">
          <input className="input" placeholder="Manufacturer (e.g. Tata)" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} required />
          <input className="input" placeholder="Model (e.g. Nexon EV)" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
          <input className="input" placeholder="Registration number (e.g. MH02AB1234)" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} required />
          <label className="text-sm">
            Connector type
            <select className="input mt-1" value={form.connectorType} onChange={(e) => setForm({ ...form, connectorType: e.target.value })}>
              {CONNECTORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Battery capacity (kWh)
            <input className="input mt-1" type="number" min={1} value={form.batteryCapacityKWh} onChange={(e) => setForm({ ...form, batteryCapacityKWh: Number(e.target.value) })} />
          </label>
          <label className="text-sm">
            Current battery (%)
            <input className="input mt-1" type="number" min={0} max={100} value={form.currentBatteryPercentage} onChange={(e) => setForm({ ...form, currentBatteryPercentage: Number(e.target.value) })} />
          </label>
          <label className="text-sm">
            Max charging speed (kW)
            <input className="input mt-1" type="number" min={1} value={form.chargingSpeedKW} onChange={(e) => setForm({ ...form, chargingSpeedKW: Number(e.target.value) })} />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Add vehicle'}
          </button>
        </form>
      </div>
    </div>
  );
}
