/**
 * Minimal, privacy-respecting analytics stub.
 *
 * No real analytics account is wired up in this academic build — this
 * module exists so the *pattern* is correct: analytics only runs after
 * explicit cookie/consent-banner acceptance (see ConsentBanner.tsx), and
 * page views are tracked without any third-party script loading until
 * then.
 *
 * To use a real provider in production:
 *   - Plausible (cookie-free): load their script tag inside enableAnalytics()
 *     and call `window.plausible('pageview')` from trackPageview().
 *   - Google Analytics 4: load gtag.js inside enableAnalytics() and call
 *     `window.gtag('event', 'page_view', { page_path: path })` from
 *     trackPageview(). Note GA4 sets cookies, so keep it strictly behind
 *     the consent gate.
 */

let enabled = false;

export function enableAnalytics() {
  enabled = true;
  // Real integration point: load your analytics provider's script here,
  // e.g.:
  // const s = document.createElement('script');
  // s.src = 'https://plausible.io/js/script.js';
  // s.dataset.domain = 'your-deployed-domain.example';
  // document.head.appendChild(s);
}

export function trackPageview(path: string) {
  if (!enabled) return;
  // Real integration point: forward to your provider, e.g.
  // window.plausible?.('pageview');
  // eslint-disable-next-line no-console
  console.debug('[analytics] pageview', path);
}

export function isAnalyticsEnabled() {
  return enabled;
}
