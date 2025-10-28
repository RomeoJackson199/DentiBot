import type { FC, ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: 'client' | 'professional';
    businessName?: string;
    category?: string;
  }) => Promise<UserProfile>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'caberu_auth';

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { user: UserProfile; token: string };
      setUser(parsed.user);
      setToken(parsed.token);
    } catch (error) {
      console.warn('Unable to parse saved auth session', error);
    }
  }, []);

  const persist = (payload: { user: UserProfile; token: string } | null) => {
    if (payload) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    setUser(response.user);
    setToken(response.token);
    persist({ user: response.user, token: response.token });
    return response.user;
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: 'client' | 'professional';
    businessName?: string;
    category?: string;
  }) => {
    const response = await authApi.register(data);
    setUser(response.user);
    setToken(response.token);
    persist({ user: response.user, token: response.token });
    return response.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    persist(null);
  };

  const value = useMemo(() => ({ user, token, login, register, logout }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
