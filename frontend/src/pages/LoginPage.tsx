import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OAuthButtons from '../components/OAuthButtons';
import { usePageTitle } from '../hooks/usePageTitle';

export default function LoginPage() {
  usePageTitle('Log In');
  const { login, error } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('user@smart-ev-charging.demo');
  const [password, setPassword] = useState('Password123!');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      const destination = (location.state as { from?: string } | null)?.from || '/';
      navigate(destination, { replace: true });
    } catch {
      // error already set in context
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="blob w-72 h-72 bg-brand-300 -top-10 -left-20" />
      <div className="blob w-72 h-72 bg-sky-300 bottom-0 right-0" />
      <div className="card w-full max-w-md relative z-10 !p-8">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl mb-4 shadow-[0_6px_16px_rgba(15,168,112,0.35)]">
          ⚡
        </div>
        <h1 className="font-display text-2xl font-extrabold mb-1">Welcome back</h1>
        <p className="text-sm text-slate-500 mb-5">Log in to find and book EV chargers near you.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" type="submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <OAuthButtons />

        <p className="text-xs text-slate-500 mt-5">
          Demo credentials: <code>user@smart-ev-charging.demo</code> / <code>Password123!</code> (or <code>admin@smart-ev-charging.demo</code> for admin)
        </p>
        <div className="mt-5 border-t border-slate-100 pt-5 text-center">
          <p className="text-sm text-slate-600 mb-3">New to Smart Electronic Vehicle Charging Management System?</p>
          <Link className="btn-secondary w-full" to="/register">
            Create a new account
          </Link>
        </div>
      </div>
    </div>
  );
}
