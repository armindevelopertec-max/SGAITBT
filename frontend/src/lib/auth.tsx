'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, extractError } from '@/lib/api';
import {
  AuthUser,
  getToken,
  getSessionUser,
  setSessionUser,
  setToken,
  clearAuth,
} from '@/lib/session';

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const sessionUser = getSessionUser();
    if (token && sessionUser) {
      setUser(sessionUser);
    }
    setLoading(false);
  }, []);

  async function login(username: string, password: string) {
    const { accessToken, user: authUser } = await apiPost<LoginResponse>('/auth/login', {
      username,
      password,
    });
    setToken(accessToken);
    setSessionUser(authUser);
    setUser(authUser);
    router.push('/');
  }

  function logout() {
    clearAuth();
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { extractError };