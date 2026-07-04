'use client';

import { useState } from 'react';
import type {
  PermissionMode,
  ProjectInvite,
  ProjectMember,
  ProjectRole,
  ProjectRoleDefinition,
  UpdateProjectMemberInput,
} from '../types';
import { InviteMemberModal } from './InviteMemberModal';
import { Button } from '@/shared/components/ui/Button';
import { formatDate } from '@/features/dashboard/utils/stats';
import { getApiErrorMessage } from '@/lib/api';

interface ProjectTeamPanelProps {
  members: ProjectMember[];
  invites: ProjectInvite[];
  isLoading: boolean;
  error: string;
  canInvite: boolean;
  canChangeRole: boolean;
  canRemove: boolean;
  canManageInvites: boolean;
  permissionMode: PermissionMode;
  customRoles: ProjectRoleDefinition[];
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
    input: UpdateProjectMemberInput,
  ) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  onRevokeInvite: (inviteId: string) => Promise<void>;
}

const roleLabels: Record<ProjectRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
};

function getMemberRoleLabel(member: ProjectMember): string {
  if (member.roleName) return member.roleName;
  if (member.role) return roleLabels[member.role];
  return 'Member';
}

function getInviteRoleLabel(invite: ProjectInvite): string {
  if (invite.roleName) return invite.roleName;
  if (invite.role) return roleLabels[invite.role];
  return 'Member';
}

export function ProjectTeamPanel({
  members,
  invites,
  isLoading,
  error,
  canInvite,
  canChangeRole,
  canRemove,
  canManageInvites,
  permissionMode,
  customRoles,
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
    input: UpdateProjectMemberInput,
  ) => {
    setActionError('');
    try {
      await onUpdateRole(userId, input);
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
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-900">
          Team · {members.length}
        </h2>
        {canInvite && (
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            onClick={() => setShowInviteModal(true)}
          >
            Invite member
          </Button>
        )}
      </div>

      <div className="p-5">
        {(error || actionError) && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || actionError}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading team...</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((member) => {
              const isOwner = member.role === 'OWNER';
              const isSelf = member.id === currentUserId;

              return (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canChangeRole && !isOwner ? (
                      permissionMode === 'CUSTOM' ? (
                        <select
                          value={member.roleDefinitionId ?? ''}
                          onChange={(event) =>
                            void handleUpdateRole(member.id, {
                              roleDefinitionId: event.target.value,
                            })
                          }
                          className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                        >
                          {customRoles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={member.role ?? 'MEMBER'}
                          onChange={(event) =>
                            void handleUpdateRole(member.id, {
                              role: event.target.value as Exclude<
                                ProjectRole,
                                'OWNER'
                              >,
                            })
                          }
                          className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      )
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {getMemberRoleLabel(member)}
                      </span>
                    )}

                    {canRemove && !isOwner && !isSelf && (
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

        {canManageInvites && invites.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Pending invites
            </h3>
            <div className="divide-y divide-gray-100">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{invite.email}</p>
                    <p className="text-gray-500">
                      {getInviteRoleLabel(invite)} · expires{' '}
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
            permissionMode={permissionMode}
            customRoles={customRoles}
            onClose={() => setShowInviteModal(false)}
            onSubmit={onInvite}
          />
        )}
      </div>
    </div>
  );
}
