'use client';

import { useState } from 'react';
import type { ProjectInvite, ProjectMember, ProjectRole } from '../types';
import { InviteMemberModal } from './InviteMemberModal';
import { Button } from '@/shared/components/ui/Button';
import { formatDate } from '@/features/dashboard/utils/stats';
import { getApiErrorMessage } from '@/lib/api';

interface ProjectTeamPanelProps {
  members: ProjectMember[];
  invites: ProjectInvite[];
  isLoading: boolean;
  error: string;
  canManage: boolean;
  currentUserId?: string;
  onInvite: (
    input: import('../types').AddProjectMemberInput,
  ) => Promise<
    | { type: 'member' }
    | { type: 'invite'; inviteUrl: string; email: string }
    | null
  >;
  onUpdateRole: (
    userId: string,
    role: Exclude<ProjectRole, 'OWNER'>,
  ) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  onRevokeInvite: (inviteId: string) => Promise<void>;
}

const roleLabels: Record<ProjectRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
};

export function ProjectTeamPanel({
  members,
  invites,
  isLoading,
  error,
  canManage,
  currentUserId,
  onInvite,
  onUpdateRole,
  onRemove,
  onRevokeInvite,
}: ProjectTeamPanelProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleUpdateRole = async (
    userId: string,
    role: Exclude<ProjectRole, 'OWNER'>,
  ) => {
    setActionError('');
    try {
      await onUpdateRole(userId, role);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  const handleRemove = async (member: ProjectMember) => {
    if (!confirm(`Remove ${member.name} from this project?`)) return;
    setActionError('');
    try {
      await onRemove(member.id);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  const handleRevoke = async (invite: ProjectInvite) => {
    if (!confirm(`Revoke invite for ${invite.email}?`)) return;
    setActionError('');
    try {
      await onRevokeInvite(invite.id);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Team ({members.length})
        </h2>
        {canManage && (
          <Button onClick={() => setShowInviteModal(true)}>
            Invite member
          </Button>
        )}
      </div>

      {(error || actionError) && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || actionError}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading team...</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const isOwner = member.role === 'OWNER';
            const isSelf = member.id === currentUserId;

            return (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  {canManage && !isOwner ? (
                    <select
                      value={member.role}
                      onChange={(event) =>
                        void handleUpdateRole(
                          member.id,
                          event.target.value as Exclude<ProjectRole, 'OWNER'>,
                        )
                      }
                      className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {roleLabels[member.role]}
                    </span>
                  )}

                  {canManage && !isOwner && !isSelf && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void handleRemove(member)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canManage && invites.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Pending invites
          </h3>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">{invite.email}</p>
                  <p className="text-gray-500">
                    {roleLabels[invite.role]} · expires{' '}
                    {formatDate(invite.expiresAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleRevoke(invite)}
                  className="text-red-600 hover:bg-red-50"
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onSubmit={onInvite}
        />
      )}
    </div>
  );
}
