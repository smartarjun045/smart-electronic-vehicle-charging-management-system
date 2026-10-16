import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { enableAnalytics } from '../utils/analytics';

const CONSENT_KEY = 'smart_electronic_vehicle_charging_management_system_consent';

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(CONSENT_KEY);
    } catch {
      // storage blocked (e.g. private mode) — just don't show the banner,
      // since we can't persist the choice anyway.
      return;
    }
    if (stored === 'accepted') enableAnalytics();
    if (!stored) setVisible(true);
  }, []);

  function choose(value: 'accepted' | 'declined') {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* ignore */
    }
    if (value === 'accepted') enableAnalytics();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg">
      <div className="card !p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-lg">
        <p className="text-xs text-slate-600 flex-1">
          Smart Electronic Vehicle Charging Management System stores your login session in your browser's local storage (not cookies) and, only if
          you accept, uses privacy-respecting analytics to see which pages are used. See our{' '}
          <Link to="/privacy" className="text-brand-600 font-medium">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <button className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => choose('declined')}>
            Decline
          </button>
          <button className="btn-primary !px-3 !py-1.5 !text-xs" onClick={() => choose('accepted')}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
