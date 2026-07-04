import { z } from 'zod';
import { isValidPermission } from '../permissions/registry';
import { sanitizeString } from '../utils/sanitize';

const customRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Role name must be at least 2 characters')
    .max(50)
    .transform(sanitizeString),
  permissions: z
    .array(z.string())
    .min(1, 'At least one permission is required')
    .refine(
      (perms) => perms.every(isValidPermission),
      'One or more permissions are invalid',
    ),
});

export const createRoleDefinitionSchema = customRoleSchema;

export const updateRoleDefinitionSchema = customRoleSchema.partial();

export const roleDefinitionParamsSchema = z.object({
  id: z.union([
    z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid project id'),
    z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  ]),
  roleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role id'),
});

export type CreateRoleDefinitionInput = z.infer<
  typeof createRoleDefinitionSchema
>;
export type UpdateRoleDefinitionInput = z.infer<
  typeof updateRoleDefinitionSchema
>;
