import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  if (err.name === 'MulterError') {
    const multerError = err as Error & { code?: string };
    const message = multerError.code === 'LIMIT_FILE_SIZE'
      ? 'File is too large (maximum 10MB)'
      : err.message;
    res.status(400).json({ status: 'error', message });
    return;
  }

  if (err.message === 'Unexpected field') {
    res.status(400).json({ status: 'error', message: 'Upload field is missing or invalid' });
    return;
  }

  if (env.NODE_ENV !== 'test') {
    console.error(err);
  }

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}
