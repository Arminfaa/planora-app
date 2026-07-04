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
import { connectSocket, disconnectSocket } from '@/lib/socket';
import type { LoginFormData, RegisterFormData } from '../types';
import type { User } from '@/shared/types/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    data: LoginFormData,
    options?: { inviteToken?: string },
  ) => Promise<void>;
  register: (data: RegisterFormData, inviteToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const profile = await authService.getMe();
      setUser(profile);
      connectSocket();
    } catch {
      setUser(null);
      disconnectSocket();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (data: LoginFormData, options?: { inviteToken?: string }) => {
      const result = await authService.login(data.email, data.password);
      setUser(result.user);
      connectSocket();

      if (options?.inviteToken) {
        router.push(`/accept-invite?token=${options.inviteToken}`);
        return;
      }

      router.push('/dashboard');
    },
    [router],
  );

  const register = useCallback(
    async (data: RegisterFormData, inviteToken?: string) => {
      const result = await authService.register(
        data.name,
        data.email,
        data.password,
        inviteToken,
      );
      setUser(result.user);
      connectSocket();

      if (result.inviteAcceptance?.projectSlug) {
        router.push(
          `/dashboard/projects/${result.inviteAcceptance.projectSlug}`,
        );
        return;
      }

      router.push('/dashboard');
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Clear client state even if the server request fails.
    }
    disconnectSocket();
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateUser = useCallback((nextUser: User) => {
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, isLoading, login, register, logout, updateUser],
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
