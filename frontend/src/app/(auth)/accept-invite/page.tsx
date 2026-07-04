'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { inviteService } from '@/features/projects/services/projectMember.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/lib/api';
import { useInvitePreview } from '@/features/projects/hooks/useProjectTeam';

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('invite') ?? searchParams.get('token');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { preview, isLoading, error } = useInvitePreview(token);
  const [actionError, setActionError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (authLoading || !token || !preview?.valid || !isAuthenticated) return;

    const accept = async () => {
      setIsAccepting(true);
      setActionError('');
      try {
        const result = await inviteService.accept(token);
        router.replace(`/dashboard/projects/${result.projectSlug}`);
      } catch (err) {
        setActionError(getApiErrorMessage(err));
        setIsAccepting(false);
      }
    };

    void accept();
  }, [authLoading, isAuthenticated, preview?.valid, router, token]);

  if (!token) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        Invite token is missing.
      </div>
    );
  }

  if (isLoading || authLoading) {
    return <LoadingSpinner />;
  }

  if (error || !preview) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || 'Invite not found'}
      </div>
    );
  }

  if (!preview.valid) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {preview.accepted
          ? 'This invite has already been used.'
          : 'This invite has expired.'}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Project invite</h2>
        <div className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-900">
          You are invited to join <strong>{preview.projectName}</strong> as{' '}
          <strong>
            {(preview.roleName ?? preview.role ?? 'member').toLowerCase()}
          </strong>
          .
        </div>
        <p className="text-sm text-gray-600">
          Sign in with <strong>{preview.email}</strong> or create an account.
        </p>
        <div className="flex gap-3">
          <Link href={`/login?invite=${token}`}>
            <Button>Sign in</Button>
          </Link>
          <Link href={`/register?invite=${token}`}>
            <Button variant="secondary">Create account</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Accepting invite...
      </h2>
      {(actionError || isAccepting) && (
        <p className="text-sm text-gray-600">
          {actionError || 'Joining project...'}
        </p>
      )}
      {!actionError && <LoadingSpinner />}
    </div>
  );
}
