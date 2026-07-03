import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config';
import { isImageMimeType } from './storage.config';

let configured = false;

function ensureConfigured(): void {
  if (configured) return;

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  configured = true;
}

export async function uploadToCloudinary(
  file: Express.Multer.File,
): Promise<{ url: string; storageKey: string }> {
  ensureConfigured();

  const folder = isImageMimeType(file.mimetype)
    ? 'project-management/images'
    : 'project-management/files';

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isImageMimeType(file.mimetype) ? 'image' : 'raw',
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }

        resolve({
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        });
      },
    );

    if (!file.buffer) {
      reject(new Error('Cloudinary upload requires file buffer'));
      return;
    }

    stream.end(file.buffer);
  });

  return {
    url: result.secure_url,
    storageKey: result.public_id,
  };
}

export async function deleteFromCloudinary(
  storageKey: string,
  resourceType: 'image' | 'raw',
): Promise<void> {
  ensureConfigured();

  await cloudinary.uploader.destroy(storageKey, {
    resource_type: resourceType,
  });
}
