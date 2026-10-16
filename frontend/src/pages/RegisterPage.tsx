import React, { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OAuthButtons from '../components/OAuthButtons';
import { usePageTitle } from '../hooks/usePageTitle';

export default function RegisterPage() {
  usePageTitle('Sign Up');
  const { register, error } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Honeypot: a field real users never see or fill in (visually hidden, not
  // display:none, so it still trips up basic bots that fill every input).
  // Any submission with this field non-empty is silently dropped as spam —
  // no error shown to the (likely automated) submitter, per standard practice.
  const honeypotRef = useRef<HTMLInputElement>(null);
  const formStartRef = useRef<number>(Date.now());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (honeypotRef.current?.value) {
      // Bot filled the hidden field — pretend success without hitting the API.
      navigate('/login');
      return;
    }
    // Extremely fast submissions (under 1.5s) are almost always scripted.
    if (Date.now() - formStartRef.current < 1500) {
      setFormError('That was fast — please try again.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password, phone || undefined);
      const destination = (location.state as { from?: string } | null)?.from || '/';
      navigate(destination, { replace: true });
    } catch {
      // error already set in context
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="blob w-72 h-72 bg-sky-300 -top-10 -right-20" />
      <div className="blob w-72 h-72 bg-brand-300 bottom-0 left-0" />
      <div className="card w-full max-w-md relative z-10 !p-8">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl mb-4 shadow-[0_6px_16px_rgba(15,168,112,0.35)]">
          ⚡
        </div>
        <h1 className="font-display text-2xl font-extrabold mb-1">Create your account</h1>
        <p className="text-sm text-slate-500 mb-5">Start booking EV charging slots anywhere in India.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input
            className="input"
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <input
            className="input"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />

          {/* Honeypot field — hidden from sighted users and screen readers,
              but present in the DOM for simple bots to fill in. */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
            <label htmlFor="website">Leave this field empty</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" ref={honeypotRef} />
          </div>

          {(formError || error) && <p className="text-sm text-red-600">{formError || error}</p>}
          <button className="btn-primary w-full" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <OAuthButtons />

        <p className="text-sm mt-5">
          Already have an account? <Link className="text-brand-600 font-semibold" to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
