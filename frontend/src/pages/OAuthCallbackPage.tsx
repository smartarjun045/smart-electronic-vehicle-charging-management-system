import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * The backend's Google/GitHub OAuth callback redirects here with
 * ?token=<JWT> on success. We just need to store it and load the profile.
 */
export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setError('No token received from the sign-in provider.');
      return;
    }
    loginWithToken(token)
      .then(() => navigate('/'))
      .catch(() => setError('Could not complete sign-in. Please try again.'));
  }, [params, loginWithToken, navigate]);

  return (
    <div className="max-w-sm mx-auto mt-24 px-4 text-center">
      {error ? (
        <div className="card">
          <p className="text-red-600 text-sm">{error}</p>
          <button className="btn-primary mt-4" onClick={() => navigate('/login')}>
            Back to login
          </button>
        </div>
      ) : (
        <p className="text-slate-500 text-sm">Signing you in...</p>
      )}
    </div>
  );
}
