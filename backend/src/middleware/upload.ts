import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.memoryStorage();

const avatarFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only JPEG, PNG, WebP, and GIF images are allowed'));
  }
};

const documentFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
    'text/plain',
  ];
  const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
  const allowedExtensions = ['.pdf', '.docx', '.md'];
  if (allowedExtensions.includes(extension) && (allowed.includes(file.mimetype) || !file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only PDF, DOCX, and Markdown files are allowed'));
  }
};

// Avatar: max 2MB
export const uploadAvatar = multer({
  storage,
  fileFilter: avatarFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('avatar');

// Document: max 10MB
export const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file');
