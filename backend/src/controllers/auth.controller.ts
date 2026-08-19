import type { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { signupSchema, loginSchema } from '../validators/auth.validator.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthenticatedRequest } from '../types.js';

export const authController = {
  async signup(req: Request, res: Response) {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0].message);
    }

    const { name, email, password } = parsed.data;
    const result = await authService.signup(name, email, password);

    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors[0].message);
    }

    const { email, password } = parsed.data;
    const result = await authService.login(email, password);

    res.json(result);
  },

  async logout(_req: Request, res: Response) {
    // JWT is stateless — frontend removes the token
    res.json({ message: 'Logged out successfully' });
  },

  async getMe(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const user = await authService.getMe(authReq.user.id);
    res.json(user);
  },
};
