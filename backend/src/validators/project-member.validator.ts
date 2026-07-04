import { PermissionMode, ProjectRole } from '@prisma/client';
import { z } from 'zod';
import { objectIdSchema } from '../utils/pagination';
import { sanitizeString } from '../utils/sanitize';

const assignableRoleSchema = z.enum([ProjectRole.ADMIN, ProjectRole.MEMBER]);

export const projectMemberParamsSchema = z.object({
  id: z.union([
    objectIdSchema,
    z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  ]),
  userId: objectIdSchema,
});

export const addProjectMemberSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .transform((v) => sanitizeString(v).toLowerCase()),
  role: assignableRoleSchema.optional(),
  roleDefinitionId: objectIdSchema.optional(),
});

export const updateProjectMemberSchema = z.object({
  role: assignableRoleSchema.optional(),
  roleDefinitionId: objectIdSchema.optional(),
});

export const createProjectInviteSchema = addProjectMemberSchema;

export const inviteTokenParamSchema = z.object({
  token: z.string().min(16).max(128),
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type UpdateProjectMemberInput = z.infer<
  typeof updateProjectMemberSchema
>;
export type CreateProjectInviteInput = z.infer<
  typeof createProjectInviteSchema
>;

export function validateMemberRoleInput(
  permissionMode: PermissionMode,
  input: { role?: ProjectRole; roleDefinitionId?: string },
  action: 'add' | 'update',
): void {
  if (permissionMode === PermissionMode.CUSTOM) {
    if (!input.roleDefinitionId) {
      throw new Error('roleDefinitionId is required for custom role projects');
    }
    return;
  }

  if (!input.role) {
    throw new Error(
      action === 'add'
        ? 'role is required for default role projects'
        : 'role is required',
    );
  }
}
