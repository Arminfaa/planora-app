import { PermissionMode } from '@prisma/client';
import { z } from 'zod';
import { objectIdSchema, paginationSchema } from '../utils/pagination';
import { sanitizeString } from '../utils/sanitize';
import { isValidPermission } from '../permissions/registry';

export const projectIdParamSchema = z.object({
  projectId: objectIdSchema,
});

export const projectParamsSchema = z.object({
  id: z.union([
    objectIdSchema,
    z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  ]),
});

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

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100)
      .transform(sanitizeString),
    description: z
      .string()
      .max(500)
      .optional()
      .transform((v) => (v ? sanitizeString(v) : undefined)),
    permissionMode: z
      .enum([PermissionMode.DEFAULT, PermissionMode.CUSTOM])
      .default(PermissionMode.DEFAULT),
    customRoles: z.array(customRoleSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.permissionMode === PermissionMode.CUSTOM) {
      if (!data.customRoles || data.customRoles.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one custom role is required',
          path: ['customRoles'],
        });
      }
    }
  });

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .transform(sanitizeString)
    .optional(),
  description: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v ? sanitizeString(v) : undefined)),
});

export const projectListQuerySchema = paginationSchema;

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
