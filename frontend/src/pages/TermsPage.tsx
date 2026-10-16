import { usePageTitle } from '../hooks/usePageTitle';

export default function TermsPage() {
  usePageTitle('Terms & Conditions');
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="card !p-8">
        <h1 className="font-display text-2xl font-extrabold mb-1">Terms &amp; Conditions</h1>
        <p className="text-xs text-slate-500 mb-6">Last updated: 2026 · Academic project template — not legal advice.</p>

        <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-4">
          <p>
            Smart Electronic Vehicle Charging Management System is provided as an academic, open-source demonstration project. By using it you
            agree to the terms below. This is a template for a student project's viva/demo — replace
            it with real terms drafted by a qualified professional before any commercial or public use.
          </p>

          <h2 className="font-display font-bold text-slate-800 text-base mt-4">1. Demo data</h2>
          <p>
            Station availability, charging sessions, energy readings, and payments shown in this
            application are simulated for demonstration purposes (see <code>docs/LIMITATIONS.md</code>).
            Nothing in this app reflects real charging infrastructure, real payments, or real electricity
            pricing.
          </p>

          <h2 className="font-display font-bold text-slate-800 text-base mt-4">2. No warranty</h2>
          <p>
            The software is provided "as is", without warranty of any kind, express or implied — see the
            MIT License in the project repository for the full legal text.
          </p>

          <h2 className="font-display font-bold text-slate-800 text-base mt-4">3. Acceptable use</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Don't attempt to abuse, overload, or reverse-engineer the booking/rate-limiting logic.</li>
            <li>Don't submit false or harmful content through any form in this app.</li>
            <li>Automated scraping or bulk account creation is not permitted.</li>
          </ul>

          <h2 className="font-display font-bold text-slate-800 text-base mt-4">4. Accounts</h2>
          <p>
            You're responsible for keeping your password (or linked Google/GitHub account) secure. We
            may suspend accounts used to abuse the platform.
          </p>

          <h2 className="font-display font-bold text-slate-800 text-base mt-4">5. Changes</h2>
          <p>These terms may change as the project evolves; continued use after a change means you accept the update.</p>

          <h2 className="font-display font-bold text-slate-800 text-base mt-4">6. Contact</h2>
          <p>Template contact section — replace with a real contact method before any public deployment.</p>
        </div>
      </div>
    </div>
  );
}
