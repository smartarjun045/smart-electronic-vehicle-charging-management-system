import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS: Array<[string, string]> = [
  ['/map', 'Map'],
  ['/bookings', 'Bookings'],
  ['/rewards', 'Rewards'],
  ['/vehicle', 'Vehicle'],
  ['/invoices', 'Invoices'],
  ['/profile', 'Profile'],
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function go(to: string) {
    setMenuOpen(false);
    navigate(to);
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-display font-extrabold text-lg text-slate-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm shadow-[0_4px_12px_rgba(15,168,112,0.4)]">
            ⚡
          </span>
          Smart Electronic Vehicle Charging Management System
          <span className="hidden sm:inline text-xs font-normal text-slate-500 ml-1">Charging, anywhere in India</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-1 text-sm">
            <div className="hidden md:flex items-center gap-1 bg-slate-100/70 rounded-full p-1 mr-2">
              {LINKS.slice(0, 4).map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="px-3 py-1.5 rounded-full font-medium text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
                >
                  {label}
                </Link>
              ))}
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="px-3 py-1.5 rounded-full font-semibold text-brand-700 hover:bg-white transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
            <span className="badge bg-gradient-to-r from-brand-50 to-emerald-50 text-brand-700 border border-brand-100">
              ✦ {user.greenPoints} pts
            </span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="btn-secondary hidden md:inline-block !px-4 !py-1.5 !text-xs ml-2"
            >
              Logout
            </button>
            {/* Mobile menu toggle — the nav links above are hidden below the md
                breakpoint, so this hamburger is the only way to reach them on
                a phone. Fixes a real mobile-navigation gap. */}
            <button
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden iconbtn w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center ml-1"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link to="/login" className="font-medium text-slate-600 hover:text-slate-900">
              Log in
            </Link>
            <Link to="/register" className="btn-primary !px-5 !py-2 !text-sm">
              Get started
            </Link>
          </div>
        )}
      </div>

      {user && menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1 text-sm">
          {LINKS.map(([to, label]) => (
            <button
              key={to}
              onClick={() => go(to)}
              className="text-left px-3 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-50"
            >
              {label}
            </button>
          ))}
          {user.role === 'ADMIN' && (
            <button onClick={() => go('/admin')} className="text-left px-3 py-2 rounded-xl font-semibold text-brand-700 hover:bg-slate-50">
              Admin
            </button>
          )}
          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
              navigate('/login');
            }}
            className="text-left px-3 py-2 rounded-xl font-medium text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
