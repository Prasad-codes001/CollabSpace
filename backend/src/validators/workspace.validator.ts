import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100),
  description: z.string().max(500).optional(),
});

export const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['OWNER', 'EDITOR', 'VIEWER']).default('VIEWER'),
});
