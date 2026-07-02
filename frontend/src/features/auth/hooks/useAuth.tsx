'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth.service';
import { getToken, removeToken, setToken } from '../utils/token';
import type { LoginFormData, RegisterFormData } from '../types';
import type { User } from '@/shared/types/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authService.getMe();
      setUser(profile);
    } catch {
      removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (data: LoginFormData) => {
      const result = await authService.login(data.email, data.password);
      setToken(result.token);
      setUser(result.user);
      router.push('/dashboard');
    },
    [router],
  );

  const register = useCallback(
    async (data: RegisterFormData) => {
      const result = await authService.register(
        data.name,
        data.email,
        data.password,
      );
      setToken(result.token);
      setUser(result.user);
      router.push('/dashboard');
    },
    [router],
  );

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
