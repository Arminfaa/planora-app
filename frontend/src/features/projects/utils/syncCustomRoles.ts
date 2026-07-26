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

function isRoleComplete(role: CustomRoleInput): boolean {
  return role.name.trim().length >= 2 && role.permissions.length > 0;
}

export type CustomRoleValidationMessages = {
  empty: string;
  incomplete: string;
};

const DEFAULT_ROLE_VALIDATION_MESSAGES: CustomRoleValidationMessages = {
  empty: 'Add at least one role with a name and one permission.',
  incomplete:
    'Each role needs a name (at least 2 characters) and at least one permission before saving.',
};

export function validateCustomRoles(
  roles: CustomRoleInput[],
  messages: CustomRoleValidationMessages = DEFAULT_ROLE_VALIDATION_MESSAGES,
): CustomRoleInput[] {
  if (roles.length === 0) {
    throw new Error(messages.empty);
  }

  const incomplete = roles.filter((role) => !isRoleComplete(role));
  if (incomplete.length > 0) {
    throw new Error(messages.incomplete);
  }

  return roles.map((role) => ({
    ...role,
    name: role.name.trim(),
  }));
}

export function hasCustomRoleChanges(
  original: ProjectRoleDefinition[],
  current: CustomRoleInput[],
): boolean {
  const normalizedCurrent = current.map((role) => ({
    id: role.id ?? null,
    name: role.name.trim(),
    permissions: [...role.permissions].sort(),
  }));
  const normalizedOriginal = toCustomRoleInputs(original).map((role) => ({
    id: role.id ?? null,
    name: role.name.trim(),
    permissions: [...role.permissions].sort(),
  }));

  return (
    JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedOriginal)
  );
}

export async function syncCustomRoles(
  projectId: string,
  original: ProjectRoleDefinition[],
  current: CustomRoleInput[],
  messages?: CustomRoleValidationMessages,
): Promise<void> {
  const validCurrent = validateCustomRoles(current, messages);
  const persistedIds = new Set(
    validCurrent
      .filter(
        (role) =>
          role.id && original.some((existing) => existing.id === role.id),
      )
      .map((role) => role.id!),
  );

  for (const role of original) {
    if (!persistedIds.has(role.id)) {
      await roleDefinitionService.delete(projectId, role.id);
    }
  }

  for (const role of validCurrent) {
    const existing = role.id
      ? original.find((item) => item.id === role.id)
      : undefined;

    if (existing) {
      const nameChanged = existing.name !== role.name;
      const permissionsChanged = !permissionsEqual(
        existing.permissions,
        role.permissions,
      );

      if (nameChanged || permissionsChanged) {
        await roleDefinitionService.update(projectId, role.id!, {
          name: role.name,
          permissions: role.permissions,
        });
      }
      continue;
    }

    await roleDefinitionService.create(projectId, {
      name: role.name,
      permissions: role.permissions,
    });
  }
}
