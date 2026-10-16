import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Re-keys its children by pathname so React remounts (and therefore
 * re-animates) the page on every route change, giving native-app-style
 * transitions via the `.page-enter` CSS animation instead of an abrupt swap.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      {children}
    </div>
  );
}
