import { roleDefinitionService } from '../services/roleDefinition.service';
import type { CustomRoleInput, ProjectRoleDefinition } from '../types';

function permissionsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((permission) => setA.has(permission));
}

export function toCustomRoleInputs(
  roles: ProjectRoleDefinition[],
): CustomRoleInput[] {
  return roles.map((role) => ({
    id: role.id,
    name: role.name,
    permissions: role.permissions,
  }));
}

export function validateCustomRoles(
  roles: CustomRoleInput[],
): CustomRoleInput[] {
  const valid = roles.filter(
    (role) => role.name.trim().length >= 2 && role.permissions.length > 0,
  );

  if (valid.length === 0) {
    throw new Error('Add at least one role with a name and one permission.');
  }

  return valid.map((role) => ({
    ...role,
    name: role.name.trim(),
  }));
}

export async function syncCustomRoles(
  projectId: string,
  original: ProjectRoleDefinition[],
  current: CustomRoleInput[],
): Promise<void> {
  const validCurrent = validateCustomRoles(current);
  const currentIds = new Set(
    validCurrent.filter((role) => role.id).map((role) => role.id!),
  );

  for (const role of original) {
    if (!currentIds.has(role.id)) {
      await roleDefinitionService.delete(projectId, role.id);
    }
  }

  for (const role of validCurrent) {
    if (role.id) {
      const existing = original.find((item) => item.id === role.id);
      if (!existing) continue;

      const nameChanged = existing.name !== role.name;
      const permissionsChanged = !permissionsEqual(
        existing.permissions,
        role.permissions,
      );

      if (nameChanged || permissionsChanged) {
        await roleDefinitionService.update(projectId, role.id, {
          name: role.name,
          permissions: role.permissions,
        });
      }
      continue;
    }

    await roleDefinitionService.create(projectId, role);
  }
}
