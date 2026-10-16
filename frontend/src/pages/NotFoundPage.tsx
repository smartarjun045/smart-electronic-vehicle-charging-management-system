import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4">🔌</div>
      <h1 className="font-display text-2xl font-extrabold mb-2">Page not found</h1>
      <p className="text-slate-500 text-sm mb-6">
        This route doesn't exist — the station or page you're looking for may have moved.
      </p>
      <Link to="/" className="btn-primary">
        Back to home
      </Link>
    </div>
  );
}
