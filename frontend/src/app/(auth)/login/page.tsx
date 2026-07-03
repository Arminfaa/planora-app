'use client';

import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Sign In</h2>
      <LoginForm inviteToken={inviteToken} />
    </div>
  );
}
