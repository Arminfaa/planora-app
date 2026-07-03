'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  inviteService,
  projectMemberService,
} from '../services/projectMember.service';
import type {
  AddProjectMemberInput,
  ProjectInvite,
  ProjectMember,
  ProjectRole,
} from '../types';

export function useProjectTeam(projectId: string | null, canManage: boolean) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTeam = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError('');
    try {
      const memberList = await projectMemberService.list(projectId);
      setMembers(memberList);

      if (canManage) {
        const inviteList = await projectMemberService.listInvites(projectId);
        setInvites(inviteList);
      } else {
        setInvites([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team');
    } finally {
      setIsLoading(false);
    }
  }, [canManage, projectId]);

  useEffect(() => {
    void fetchTeam();
  }, [fetchTeam]);

  const inviteMember = useCallback(
    async (input: AddProjectMemberInput) => {
      if (!projectId) return null;
      const result = await projectMemberService.add(projectId, input);
      await fetchTeam();
      return result;
    },
    [fetchTeam, projectId],
  );

  const updateMemberRole = useCallback(
    async (userId: string, role: Exclude<ProjectRole, 'OWNER'>) => {
      if (!projectId) return;
      await projectMemberService.updateRole(projectId, userId, role);
      await fetchTeam();
    },
    [fetchTeam, projectId],
  );

  const removeMember = useCallback(
    async (userId: string) => {
      if (!projectId) return;
      await projectMemberService.remove(projectId, userId);
      await fetchTeam();
    },
    [fetchTeam, projectId],
  );

  const revokeInvite = useCallback(
    async (inviteId: string) => {
      if (!projectId) return;
      await projectMemberService.revokeInvite(projectId, inviteId);
      await fetchTeam();
    },
    [fetchTeam, projectId],
  );

  return {
    members,
    invites,
    isLoading,
    error,
    refetch: fetchTeam,
    inviteMember,
    updateMemberRole,
    removeMember,
    revokeInvite,
  };
}

export function useInvitePreview(token: string | null) {
  const [preview, setPreview] = useState<
    import('../types').InvitePreview | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setPreview(null);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await inviteService.getPreview(token);
        setPreview(data);
      } catch (err) {
        setPreview(null);
        setError(err instanceof Error ? err.message : 'Invalid invite');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [token]);

  return { preview, isLoading, error };
}
