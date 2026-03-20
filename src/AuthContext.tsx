import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authApi, profileApi, setTokens, clearTokens, getAccessToken, getRefreshToken } from './api';
import type { UserProfile } from './api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      profileApi.get()
        .then(setUser)
        .catch(() => clearTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await authApi.register({ email, password, displayName });
    setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  }, []);

  const loginWithGoogle = useCallback(async (code: string) => {
    const res = await authApi.googleCallback(code);
    setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    const rt = getRefreshToken();
    if (rt) {
      try { await authApi.logout(rt); } catch { /* ignore */ }
    }
    clearTokens();
    setUser(null);
  }, []);

  const updateUser = useCallback((u: UserProfile) => setUser(u), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
