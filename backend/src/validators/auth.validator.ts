import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

const sanitizeString = (value: string) =>
  sanitizeHtml(value.trim(), { allowedTags: [], allowedAttributes: {} });

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .transform(sanitizeString),
  email: z
    .string()
    .email('Invalid email address')
    .transform((v) => sanitizeString(v).toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  inviteToken: z.string().min(16).max(128).optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .transform((v) => sanitizeString(v).toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
