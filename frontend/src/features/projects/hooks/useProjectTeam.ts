'use client';

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  inviteService,
  projectMemberService,
} from '../services/projectMember.service';
import type {
  AddProjectMemberInput,
  ProjectInvite,
  ProjectMember,
  UpdateProjectMemberInput,
} from '../types';
import { getApiErrorMessage, isForbiddenError } from '@/lib/api';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';

export function useProjectTeam(
  projectId: string | null,
  enabled = true,
  canManageInvites = false,
) {
  const queryClient = useQueryClient();
  const membersKey = queryKeys.projects.members(projectId ?? '');
  const invitesKey = queryKeys.projects.invites(projectId ?? '');

  const membersQuery = useQuery({
    queryKey: membersKey,
    queryFn: () => projectMemberService.list(projectId!),
    enabled: Boolean(projectId && enabled),
    staleTime: STALE_TIME.members,
  });

  const invitesQuery = useQuery({
    queryKey: invitesKey,
    queryFn: () => projectMemberService.listInvites(projectId!),
    enabled: Boolean(projectId && enabled && canManageInvites),
    staleTime: STALE_TIME.invites,
    retry: (_, error) => !isForbiddenError(error),
  });

  const invalidateTeam = useCallback(() => {
    if (!projectId) return Promise.resolve();
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: membersKey }),
      canManageInvites
        ? queryClient.invalidateQueries({ queryKey: invitesKey })
        : Promise.resolve(),
    ]).then(() => undefined);
  }, [canManageInvites, invitesKey, membersKey, projectId, queryClient]);

  const inviteMutation = useMutation({
    mutationFn: (input: AddProjectMemberInput) =>
      projectMemberService.add(projectId!, input),
    onSuccess: () => invalidateTeam(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string;
      input: UpdateProjectMemberInput;
    }) => projectMemberService.updateRole(projectId!, userId, input),
    onSuccess: () => invalidateTeam(),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      projectMemberService.remove(projectId!, userId),
    onSuccess: () => invalidateTeam(),
  });

  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) =>
      projectMemberService.revokeInvite(projectId!, inviteId),
    onSuccess: () => invalidateTeam(),
  });

  const inviteMember = useCallback(
    async (input: AddProjectMemberInput) => {
      if (!projectId) return null;
      return inviteMutation.mutateAsync(input);
    },
    [inviteMutation, projectId],
  );

  const updateMemberRole = useCallback(
    async (userId: string, input: UpdateProjectMemberInput) => {
      if (!projectId) return;
      await updateRoleMutation.mutateAsync({ userId, input });
    },
    [projectId, updateRoleMutation],
  );

  const removeMember = useCallback(
    async (userId: string) => {
      if (!projectId) return;
      await removeMutation.mutateAsync(userId);
    },
    [projectId, removeMutation],
  );

  const revokeInvite = useCallback(
    async (inviteId: string) => {
      if (!projectId) return;
      await revokeInviteMutation.mutateAsync(inviteId);
    },
    [projectId, revokeInviteMutation],
  );

  const members = enabled ? (membersQuery.data ?? []) : [];
  const invites: ProjectInvite[] =
    enabled && canManageInvites ? (invitesQuery.data ?? []) : [];

  const queryError = membersQuery.error ?? invitesQuery.error;
  const error =
    queryError && !isForbiddenError(queryError)
      ? getApiErrorMessage(queryError)
      : '';

  return {
    members,
    invites,
    isLoading:
      (enabled && membersQuery.isLoading) ||
      (enabled && canManageInvites && invitesQuery.isLoading),
    error,
    refetch: invalidateTeam,
    inviteMember,
    updateMemberRole,
    removeMember,
    revokeInvite,
  };
}

export function useInvitePreview(token: string | null) {
  const query = useQuery({
    queryKey: queryKeys.invites.preview(token ?? ''),
    queryFn: () => inviteService.getPreview(token!),
    enabled: Boolean(token),
    staleTime: STALE_TIME.invitePreview,
    retry: false,
  });

  return {
    preview: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? getApiErrorMessage(query.error) : '',
  };
}
