import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ConsentBanner from './components/ConsentBanner';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';
import { trackPageview } from './utils/analytics';

// Route-level code splitting: each page loads only when visited, instead of
// one large upfront bundle — a real page-load-speed improvement, not just a
// cosmetic one (see docs/LIMITATIONS.md "page load" note removed once this
// landed).
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const StationDetailPage = lazy(() => import('./pages/StationDetailPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const BookingDetailPage = lazy(() => import('./pages/BookingDetailPage'));
const ChargingSessionPage = lazy(() => import('./pages/ChargingSessionPage'));
const VehiclePage = lazy(() => import('./pages/VehiclePage'));
const RewardsPage = lazy(() => import('./pages/RewardsPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageviewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageview(location.pathname);
  }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <PageviewTracker />
      <div className="flex-1">
        <Suspense fallback={<div className="p-10 text-center text-slate-500 text-sm">Loading...</div>}>
          <PageTransition>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
            <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/stations/:id" element={<ProtectedRoute><StationDetailPage /></ProtectedRoute>} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
            <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
            <Route path="/charging/:sessionId" element={<ProtectedRoute><ChargingSessionPage /></ProtectedRoute>} />
            <Route path="/vehicle" element={<ProtectedRoute><VehiclePage /></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<ProtectedRoute><NotFoundPage /></ProtectedRoute>} />
          </Routes>
          </PageTransition>
        </Suspense>
      </div>
      <Footer />
      <ConsentBanner />
    </div>
  );
}
