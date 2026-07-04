'use client';

import { useEffect, useState } from 'react';
import { CustomRolesBuilder } from '@/features/dashboard/components/CustomRolesBuilder';
import { PERMISSION_GROUPS } from '@/features/permissions/registry';
import { projectService } from '../services/project.service';
import type { CustomRoleInput, ProjectRoleDefinition } from '../types';
import {
  hasCustomRoleChanges,
  syncCustomRoles,
  toCustomRoleInputs,
  validateCustomRoles,
} from '../utils/syncCustomRoles';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { getApiErrorMessage } from '@/lib/api';

interface CurrentUserRoleInfo {
  id?: string | null;
  name?: string | null;
  permissions: string[];
}

interface ProjectRolesPanelProps {
  projectId: string;
  canManage: boolean;
  currentUserRole?: CurrentUserRoleInfo;
  onRolesChange?: (roles: ProjectRoleDefinition[]) => void;
}

export function ProjectRolesPanel({
  projectId,
  canManage,
  currentUserRole,
  onRolesChange,
}: ProjectRolesPanelProps) {
  const [originalRoles, setOriginalRoles] = useState<ProjectRoleDefinition[]>(
    [],
  );
  const [roles, setRoles] = useState<CustomRoleInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRoles = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await projectService.listRoles(projectId);
      setOriginalRoles(data);
      setRoles(toCustomRoleInputs(data));
      onRolesChange?.(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) {
      void loadRoles();
      return;
    }

    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- non-managers only see their own role
  }, [projectId, canManage]);

  const ownRole: ProjectRoleDefinition | null =
    currentUserRole?.name != null
      ? {
          id: currentUserRole.id ?? 'current-user-role',
          name: currentUserRole.name,
          permissions: currentUserRole.permissions,
          position: 0,
          createdAt: '',
          updatedAt: '',
        }
      : null;

  const hasChanges = hasCustomRoleChanges(originalRoles, roles);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);
    try {
      validateCustomRoles(roles);
      await syncCustomRoles(projectId, originalRoles, roles);
      await loadRoles();
      setSuccess('Roles updated successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setRoles(toCustomRoleInputs(originalRoles));
    setError('');
    setSuccess('');
  };

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Roles & Permissions
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {canManage
              ? 'Define what each custom role can do in this project.'
              : 'Your role and permissions in this project.'}
          </p>
        </div>
      </div>

      <div className="p-5">
        {canManage && (
          <p className="mb-4 text-sm text-gray-500">
            Add or edit roles below, then click Save roles to apply changes.
          </p>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : canManage ? (
          <CustomRolesBuilder roles={roles} onChange={setRoles} />
        ) : !ownRole ? (
          <p className="text-sm text-gray-500">No role assigned.</p>
        ) : (
          <RolePermissionsSummary role={ownRole} defaultExpanded />
        )}
      </div>

      {canManage && (
        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            isLoading={isSaving}
            disabled={!hasChanges}
          >
            Save roles
          </Button>
        </div>
      )}
    </div>
  );
}

function RolePermissionsSummary({
  role,
  defaultExpanded = false,
}: {
  role: ProjectRoleDefinition;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="font-medium text-gray-900">{role.name}</p>
          <p className="text-xs text-gray-500">
            {role.permissions.length} permission
            {role.permissions.length === 1 ? '' : 's'}
          </p>
        </div>
        <span className="text-gray-400">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-gray-200 px-4 py-3">
          {PERMISSION_GROUPS.map((group) => {
            const groupPermissions = group.permissions.filter((permission) =>
              role.permissions.includes(permission.key),
            );
            if (groupPermissions.length === 0) return null;

            return (
              <div key={group.key}>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {group.label}
                </p>
                <ul className="mt-1.5 space-y-1">
                  {groupPermissions.map((permission) => (
                    <li key={permission.key} className="text-sm text-gray-700">
                      {permission.label}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
