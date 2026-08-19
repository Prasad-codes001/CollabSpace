import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128).optional(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

export const updateSecuritySchema = z.object({
  requireTwoFactor: z.boolean().optional(),
  allowPublicLinks: z.boolean().optional(),
  ssoProvider: z.enum(['OKTA', 'GOOGLE', 'DISABLED']).optional(),
  sessionTimeoutMinutes: z.number().min(5).max(1440).optional(),
});
