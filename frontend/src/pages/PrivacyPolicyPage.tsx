import { usePageTitle } from '../hooks/usePageTitle';

export default function PrivacyPolicyPage() {
  usePageTitle('Privacy Policy');
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="card !p-8">
        <h1 className="font-display text-2xl font-extrabold mb-1">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mb-6">Last updated: 2026 · Academic project template — not legal advice.</p>

        <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-4">
          <p>
            EVSync is an academic demonstration project. This policy describes, in plain language,
            what data the application collects and how it is used in this build. If you deploy
            EVSync for real users, have this reviewed by a qualified lawyer before relying on it.
          </p>

          <h2 className="font-display font-bold text-slate-800 text-base mt-4">What we collect</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Account data you provide: name, email, phone (optional), password (hashed, never stored in plain text).</li>
            <li>If you sign in with Google or GitHub: your name, email, and profile photo, as shared by that provider.</li>
            <li>Vehicle profiles, bookings, charging sessions, and invoices you create while using the app.</li>
            <li>Your location, only if you grant browser permission, used solely to find nearby stations — never stored on our servers beyond the current request.</li>
            <li>Standard server logs (IP address, timestamp, request path) for security and debugging.</li>
          </ul>

          <h2 className="font-display font-bold text-slate-800 text-base mt-4">What we don't do</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>We don't sell or share your data with advertisers.</li>
            <li>We don't run third-party ad trackers.</li>
            <li>QR codes generated for check-in encode only an opaque booking token — never personal data.</li>
          </ul>

          <h2 className="font-display font-bold text-slate-800 text-base mt-4">Cookies & local storage</h2>
          <p>
            EVSync stores your session token and theme preference in your browser's local storage, not
            cookies, so there is nothing sent to the server on every request beyond what you explicitly
            do. If optional analytics is enabled (see the cookie/consent banner), it only runs after you
            accept, and can be disabled at any time by clearing site data.
          </p>

          <h2 className="font-display font-bold text-slate-800 text-base mt-4">Data simulated for this demo</h2>
          <p>
            Charging session telemetry, charger availability, and payment records in this build are
            simulated for demonstration — see <code>docs/LIMITATIONS.md</code> in the project repository
            for the full breakdown of real vs. simulated data.
          </p>

          <h2 className="font-display font-bold text-slate-800 text-base mt-4">Your rights</h2>
          <p>
            You can request deletion of your account and associated data by contacting the project
            maintainer (or, in this local demo, by clearing your own database).
          </p>

          <h2 className="font-display font-bold text-slate-800 text-base mt-4">Contact</h2>
          <p>This is a template contact section — replace with a real contact method before any public deployment.</p>
        </div>
      </div>
    </div>
  );
}
