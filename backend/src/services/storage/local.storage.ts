import fs from 'fs/promises';
import path from 'path';
import { env } from '../../config';
import { isImageMimeType } from './storage.config';

const uploadsRoot = path.join(__dirname, '../../uploads');

export async function ensureUploadDirs(): Promise<void> {
  await fs.mkdir(path.join(uploadsRoot, 'images'), { recursive: true });
  await fs.mkdir(path.join(uploadsRoot, 'files'), { recursive: true });
}

function getSubdir(mimeType: string): 'images' | 'files' {
  return isImageMimeType(mimeType) ? 'images' : 'files';
}

function buildFilename(originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
}

export async function saveLocalFile(
  file: Express.Multer.File,
): Promise<{ url: string; storageKey: string }> {
  await ensureUploadDirs();

  const subdir = getSubdir(file.mimetype);
  const filename = buildFilename(file.originalname);
  const absolutePath = path.join(uploadsRoot, subdir, filename);

  if (file.buffer) {
    await fs.writeFile(absolutePath, file.buffer);
  } else if (file.path) {
    await fs.copyFile(file.path, absolutePath);
    await fs.unlink(file.path).catch(() => undefined);
  } else {
    throw new Error('Uploaded file is missing data');
  }

  return {
    storageKey: `${subdir}/${filename}`,
    url: `/uploads/${subdir}/${filename}`,
  };
}

export async function saveLocalBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<{ url: string; storageKey: string }> {
  await ensureUploadDirs();

  const subdir = getSubdir(mimeType);
  const filename = buildFilename(originalName);
  const absolutePath = path.join(uploadsRoot, subdir, filename);
  await fs.writeFile(absolutePath, buffer);

  return {
    storageKey: `${subdir}/${filename}`,
    url: `/uploads/${subdir}/${filename}`,
  };
}

export function resolveLocalAbsolutePath(storageKey: string): string {
  return path.join(uploadsRoot, storageKey);
}

export async function deleteLocalFile(storageKey: string): Promise<void> {
  const absolutePath = path.join(uploadsRoot, storageKey);
  await fs.unlink(absolutePath).catch(() => undefined);
}

export function getPublicAssetUrl(relativeUrl: string): string {
  if (relativeUrl.startsWith('http')) {
    return relativeUrl;
  }

  return `${env.API_PUBLIC_URL.replace(/\/$/, '')}${relativeUrl}`;
}
