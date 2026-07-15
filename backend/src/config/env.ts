import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/** Strip accidental wrapping quotes from Render/hosting paste. */
const trimEnv = (value: string) => value.trim().replace(/^['"]|['"]$/g, '');

const optionalTrimmed = z
  .string()
  .optional()
  .transform((value) => {
    if (value == null) return undefined;
    const trimmed = trimEnv(value);
    return trimmed || undefined;
  });

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .default('mongodb://127.0.0.1:27018/project_management?replicaSet=rs0'),
  JWT_SECRET: z.string().min(1).default('dev-secret-change-in-production'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  MAX_FILE_SIZE: z.coerce.number().default(5_242_880),
  MAX_IMAGE_SIZE: z.coerce.number().default(2_097_152),
  CLOUDINARY_CLOUD_NAME: optionalTrimmed,
  CLOUDINARY_API_KEY: optionalTrimmed,
  CLOUDINARY_API_SECRET: optionalTrimmed,
  API_PUBLIC_URL: z.string().default('http://localhost:5000'),
  VAPID_PUBLIC_KEY: optionalTrimmed,
  VAPID_PRIVATE_KEY: optionalTrimmed,
  VAPID_SUBJECT: z.string().default('mailto:admin@localhost'),
  APP_PUBLIC_URL: z.string().default('http://localhost:3000'),
  RESEND_API_KEY: optionalTrimmed,
  RESEND_FROM_EMAIL: z
    .string()
    .default('Planora <onboarding@resend.dev>')
    .transform(trimEnv),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
