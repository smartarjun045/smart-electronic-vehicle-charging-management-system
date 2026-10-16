import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, unwrapError } from '../api/client';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  loginWithToken: (accessToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem('evsync_access_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/users/me');
      const u = res.data.data;
      setUser({ id: u._id, name: u.name, email: u.email, role: u.role, greenPoints: u.greenPoints });
    } catch {
      localStorage.removeItem('evsync_access_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user: u } = res.data.data;
      localStorage.setItem('evsync_access_token', accessToken);
      setUser(u);
    } catch (err) {
      setError(unwrapError(err));
      throw err;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password, phone });
      const { accessToken, user: u } = res.data.data;
      localStorage.setItem('evsync_access_token', accessToken);
      setUser(u);
    } catch (err) {
      setError(unwrapError(err));
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('evsync_access_token');
    setUser(null);
  }, []);

  // Used by /oauth-callback after a successful Google/GitHub redirect: the
  // backend already issued a JWT, we just need to store it and load the profile.
  const loginWithToken = useCallback(async (accessToken: string) => {
    localStorage.setItem('evsync_access_token', accessToken);
    await refreshMe();
  }, [refreshMe]);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refreshMe, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
