import multer from 'multer';
import { env } from '../config';
import { IMAGE_MIME_TYPES } from '../services/storage/storage.config';

export const imageUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_IMAGE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('Only image files are allowed'));
      return;
    }

    cb(null, true);
  },
}).single('file');
