'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';

export function DashboardWelcome() {
  const { user } = useAuth();

  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome back, {user?.name?.split(' ')[0] ?? 'there'}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Here&apos;s an overview of your projects and boards
      </p>
    </div>
  );
}
