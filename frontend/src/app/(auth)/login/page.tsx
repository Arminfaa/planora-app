'use client';

import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
        Welcome back
      </h2>
      <LoginForm inviteToken={inviteToken} />
    </div>
  );
}
