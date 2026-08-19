import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JwtPayload } from '../types.js';

export function signToken(payload: JwtPayload): string {
  const options: jwt.SignOptions = {};
  options.expiresIn = env.JWT_EXPIRES_IN as unknown as number;
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
