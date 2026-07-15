'use client';

import { useParams } from 'next/navigation';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';

export default function ResetPasswordTokenPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params.token === 'string' ? params.token : '';

  if (!token) {
    return <LoadingSpinner />;
  }

  return <ResetPasswordForm token={decodeURIComponent(token)} />;
}
