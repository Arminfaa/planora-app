'use client';

import { useSearchParams } from 'next/navigation';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
        Create your account
      </h2>
      <RegisterForm inviteToken={inviteToken} />
    </div>
  );
}
