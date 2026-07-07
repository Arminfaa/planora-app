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
import { useLocale } from '@/i18n/LocaleProvider';

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('invite') ?? searchParams.get('token');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { preview, isLoading, error } = useInvitePreview(token);
  const [actionError, setActionError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const { t } = useLocale();

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
        {t('auth.acceptInvitePage.tokenMissing')}
      </div>
    );
  }

  if (isLoading || authLoading) {
    return <LoadingSpinner />;
  }

  if (error || !preview) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || t('auth.acceptInvitePage.notFound')}
      </div>
    );
  }

  if (!preview.valid) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {preview.accepted
          ? t('auth.acceptInvitePage.alreadyUsed')
          : t('auth.acceptInvitePage.expired')}
      </div>
    );
  }

  const roleName = (preview.roleName ?? preview.role ?? 'member').toLowerCase();

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {t('auth.acceptInvitePage.title')}
        </h2>
        <div className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-900">
          {t('invite.acceptDescription', {
            projectName: preview.projectName ?? '',
          })}{' '}
          ({roleName})
        </div>
        <p className="text-sm text-gray-600">
          {t('auth.acceptInvitePage.signInWithEmail', {
            email: preview.email ?? '',
          })}
        </p>
        <div className="flex gap-3">
          <Link href={`/login?invite=${token}`}>
            <Button>{t('auth.acceptInvitePage.signIn')}</Button>
          </Link>
          <Link href={`/register?invite=${token}`}>
            <Button variant="secondary">
              {t('auth.acceptInvitePage.createAccount')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">
        {t('auth.acceptInvitePage.accepting')}
      </h2>
      {(actionError || isAccepting) && (
        <p className="text-sm text-gray-600">
          {actionError || t('auth.acceptInvitePage.joining')}
        </p>
      )}
      {!actionError && <LoadingSpinner />}
    </div>
  );
}
