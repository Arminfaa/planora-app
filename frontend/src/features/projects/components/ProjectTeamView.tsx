'use client';

import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProjectPermissions } from '@/features/permissions/hooks/useProjectPermissions';
import { useProjectTeam } from '../hooks/useProjectTeam';
import { useProjectContext } from '../context/ProjectContext';
import { ProjectTeamPanel } from './ProjectTeamPanel';
import type { AddProjectMemberInput } from '../types';

export function ProjectTeamView() {
  const { user } = useAuth();
  const { project, customRoles, setMemberCount } = useProjectContext();
  const { can } = useProjectPermissions(project);

  const canViewTeam = can('team.view');
  const canManageInvites = can('team.manage_invites');

  const {
    members,
    invites,
    isLoading,
    error,
    inviteMember,
    updateMemberRole,
    removeMember,
    revokeInvite,
  } = useProjectTeam(project.id, canViewTeam, canManageInvites);

  useEffect(() => {
    setMemberCount(members.length);
  }, [members.length, setMemberCount]);

  const handleInviteMember = async (data: AddProjectMemberInput) => {
    const result = await inviteMember(data);
    if (!result) return null;

    if (result.type === 'member') {
      return { type: 'member' as const };
    }

    const inviteUrl = `${window.location.origin}/register?invite=${result.invite.token}`;
    await navigator.clipboard.writeText(inviteUrl);
    return {
      type: 'invite' as const,
      inviteUrl,
      email: result.invite.email,
    };
  };

  if (!canViewTeam) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">
            You do not have permission to view the project team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <ProjectTeamPanel
        members={members}
        invites={invites}
        isLoading={isLoading}
        error={error}
        canInvite={can('team.invite')}
        canChangeRole={can('team.change_role')}
        canRemove={can('team.remove')}
        canManageInvites={canManageInvites}
        permissionMode={project.permissionMode ?? 'DEFAULT'}
        customRoles={customRoles}
        currentUserId={user?.id}
        onInvite={handleInviteMember}
        onUpdateRole={updateMemberRole}
        onRemove={removeMember}
        onRevokeInvite={revokeInvite}
      />
    </div>
  );
}
