import multer from 'multer';
import { env } from '../config';

const BACKUP_MIME_TYPES = new Set([
  'application/octet-stream',
  'application/gzip',
  'application/x-gzip',
  'application/json',
  'application/x-planora',
  'application/zip',
]);

export const backupUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_BACKUP_SIZE },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    const allowedExtension =
      name.endsWith('.planora') ||
      name.endsWith('.json') ||
      name.endsWith('.gz');

    if (allowedExtension || BACKUP_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error('Only .planora backup files are allowed'));
  },
}).single('file');
