import { AttachmentType } from '@prisma/client';
import { env } from '../../config';
import { ApiError } from '../../utils/ApiError';
import {
  ALLOWED_MIME_TYPES,
  isCloudinaryEnabled,
  isImageMimeType,
} from './storage.config';
import { deleteFromCloudinary, uploadToCloudinary } from './cloudinary.storage';
import {
  deleteLocalFile,
  getPublicAssetUrl,
  saveLocalFile,
} from './local.storage';

export interface StoredFile {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  type: AttachmentType;
  storageKey: string;
  storageProvider: 'local' | 'cloudinary';
}

function validateFile(file: Express.Multer.File): void {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new ApiError(400, 'File type is not allowed');
  }

  const maxSize = isImageMimeType(file.mimetype)
    ? env.MAX_IMAGE_SIZE
    : env.MAX_FILE_SIZE;

  if (file.size > maxSize) {
    throw new ApiError(400, 'File exceeds maximum allowed size');
  }
}

export async function storeUploadedFile(
  file: Express.Multer.File,
): Promise<StoredFile> {
  validateFile(file);

  const stored = isCloudinaryEnabled()
    ? await uploadToCloudinary(file)
    : await saveLocalFile(file);

  return {
    filename: file.originalname,
    url: stored.url,
    mimeType: file.mimetype,
    size: file.size,
    type: isImageMimeType(file.mimetype)
      ? AttachmentType.IMAGE
      : AttachmentType.FILE,
    storageKey: stored.storageKey,
    storageProvider: isCloudinaryEnabled() ? 'cloudinary' : 'local',
  };
}

export async function removeStoredFile(
  storageKey: string,
  storageProvider: 'local' | 'cloudinary',
  attachmentType?: 'IMAGE' | 'FILE',
): Promise<void> {
  if (storageProvider === 'cloudinary') {
    await deleteFromCloudinary(
      storageKey,
      attachmentType === 'IMAGE' ? 'image' : 'raw',
    );
    return;
  }

  await deleteLocalFile(storageKey);
}

export function serializeAttachmentUrl(url: string): string {
  return getPublicAssetUrl(url);
}
