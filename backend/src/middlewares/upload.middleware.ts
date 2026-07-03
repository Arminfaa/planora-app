import multer from 'multer';
import { env } from '../config';
import { ALLOWED_MIME_TYPES } from '../services/storage/storage.config';

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('File type is not allowed'));
      return;
    }

    cb(null, true);
  },
}).single('file');
