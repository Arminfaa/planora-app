'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  AddProjectMemberInput,
  PermissionMode,
  ProjectRole,
  ProjectRoleDefinition,
} from '../types';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
  roleDefinitionId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

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
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const {
    register,
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
          setError('Select a role for the invited member.');
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
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  };

  const selectClassName =
    'block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Invite Member</h2>
        <p className="mt-1 text-sm text-gray-600">
          Existing users are added immediately. New users receive an invite
          link.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {inviteUrl ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              Invite link created. Share it with the invited user.
            </div>
            <Input label="Invite link" value={inviteUrl} readOnly />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Done
              </Button>
              <Button type="button" onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy link'}
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="mt-4 space-y-4"
          >
            <Input
              label="Email"
              type="email"
              placeholder="teammate@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              {permissionMode === 'CUSTOM' ? (
                <select
                  className={selectClassName}
                  {...register('roleDefinitionId')}
                >
                  {customRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              ) : (
                <select className={selectClassName} {...register('role')}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Send invite
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
