import { Link } from 'react-router-dom';
import { Station } from '../types';

export default function StationCard({ station }: { station: Station }) {
  return (
    <div className="card hoverable flex h-full flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{station.name}</h3>
          <p className="text-xs text-slate-500">{station.address}</p>
        </div>
        <span className="badge bg-amber-50 text-amber-700">★ {station.rating.toFixed(1)}</span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        {station.distanceKm !== undefined && (
          <span className="badge bg-slate-100">{station.distanceKm} km away</span>
        )}
        <span className={`badge ${station.availableChargers > 0 ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600'}`}>
          {station.availableChargers}/{station.totalChargers} available
        </span>
        <span className="badge bg-slate-100">₹{station.pricePerKWh}/kWh</span>
        {station.renewableEnergy && <span className="badge bg-emerald-50 text-emerald-700">🌱 Renewable</span>}
        <span className="badge bg-slate-100">{station.openingHours}</span>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row">
        <Link to={`/stations/${station._id}`} className="btn-secondary flex-1 text-center text-sm">
          View Details
        </Link>
        <Link to={`/stations/${station._id}?book=1`} className="btn-primary flex-1 text-center text-sm">
          Book Now
        </Link>
      </div>
    </div>
  );
}
