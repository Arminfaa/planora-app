import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

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
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  MAX_FILE_SIZE: z.coerce.number().default(5_242_880),
  MAX_IMAGE_SIZE: z.coerce.number().default(2_097_152),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  API_PUBLIC_URL: z.string().default('http://localhost:5000'),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
