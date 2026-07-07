'use client';

import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from 'antd';
import type {
  AddProjectMemberInput,
  PermissionMode,
  ProjectRole,
  ProjectRoleDefinition,
} from '../types';
import { Input } from '@/shared/components/ui/Input';
import { SelectField } from '@/shared/components/ui/SelectField';
import { getApiErrorMessage } from '@/lib/api';
import { useLocale } from '@/i18n/LocaleProvider';
import { AppModal } from '@/shared/components/ui/AppModal';

type FormData = {
  email: string;
  role?: 'ADMIN' | 'MEMBER';
  roleDefinitionId?: string;
};

const FORM_ID = 'invite-member-form';

interface InviteMemberModalProps {
  permissionMode: PermissionMode;
  customRoles: ProjectRoleDefinition[];
  onClose: () => void;
  onSubmit: (
    input: AddProjectMemberInput,
  ) => Promise<
    | { type: 'member' }
    | { type: 'invite'; inviteUrl: string; email: string }
    | null
  >;
}

export function InviteMemberModal({
  permissionMode,
  customRoles,
  onClose,
  onSubmit,
}: InviteMemberModalProps) {
  const { t } = useLocale();
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('auth.errors.invalidEmail')),
        role: z.enum(['ADMIN', 'MEMBER']).optional(),
        roleDefinitionId: z.string().optional(),
      }),
    [t],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'MEMBER',
      roleDefinitionId: customRoles[0]?.id,
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    setError('');
    setCopied(false);
    try {
      const input: AddProjectMemberInput = {
        email: data.email.trim().toLowerCase(),
      };

      if (permissionMode === 'CUSTOM') {
        if (!data.roleDefinitionId) {
          setError(t('validation.selectRoleForInvite'));
          return;
        }
        input.roleDefinitionId = data.roleDefinitionId;
      } else {
        input.role = (data.role ?? 'MEMBER') as Exclude<ProjectRole, 'OWNER'>;
      }

      const result = await onSubmit(input);

      if (!result) return;

      if (result.type === 'member') {
        onClose();
        return;
      }

      setInviteUrl(result.inviteUrl);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    setError('');

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setCopied(true);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = inviteUrl;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
      } catch {
        setError(t('invite.copyLinkFailed'));
      }
    }
  };

  const customRoleOptions = customRoles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  const defaultRoleOptions = [
    { value: 'MEMBER', label: t('team.member') },
    { value: 'ADMIN', label: t('team.admin') },
  ];

  return (
    <AppModal
      title={t('invite.titleMember')}
      subtitle={t('invite.subtitle')}
      onClose={onClose}
      footer={
        inviteUrl ? (
          <>
            <Button onClick={onClose}>{t('common.done')}</Button>
            <Button type="primary" onClick={handleCopy}>
              {copied ? t('common.copied') : t('invite.copyLink')}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button
              type="primary"
              htmlType="submit"
              form={FORM_ID}
              loading={isSubmitting}
            >
              {t('invite.sendInvite')}
            </Button>
          </>
        )
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {inviteUrl ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            {t('invite.linkCreated')}
          </div>
          <Input
            label={t('invite.inviteLinkLabel')}
            value={inviteUrl}
            readOnly
          />
        </div>
      ) : (
        <form
          id={FORM_ID}
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <Input
            label={t('common.email')}
            type="email"
            placeholder={t('invite.emailPlaceholder')}
            error={errors.email?.message}
            {...register('email')}
          />
          {permissionMode === 'CUSTOM' ? (
            <Controller
              name="roleDefinitionId"
              control={control}
              render={({ field }) => (
                <SelectField
                  label={t('team.role')}
                  options={customRoleOptions}
                  {...field}
                />
              )}
            />
          ) : (
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <SelectField
                  label={t('team.role')}
                  options={defaultRoleOptions}
                  {...field}
                />
              )}
            />
          )}
        </form>
      )}
    </AppModal>
  );
}
