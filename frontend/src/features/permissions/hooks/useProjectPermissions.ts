import { hasPermission, type Permission } from '../registry';
import type { Project } from '@/features/projects/types';

export function useProjectPermissions(project: Project | null) {
  const permissions = project?.currentUserPermissions ?? [];

  return {
    permissions,
    can: (permission: Permission) => hasPermission(permissions, permission),
    canAny: (...perms: Permission[]) =>
      perms.some((p) => hasPermission(permissions, p)),
    canAll: (...perms: Permission[]) =>
      perms.every((p) => hasPermission(permissions, p)),
  };
}
