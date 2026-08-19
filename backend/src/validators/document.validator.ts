import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  type: z.enum(['blank', 'template', 'docx', 'markdown', 'pdf']).default('blank'),
  workspaceId: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        content: z.string(),
      })
    )
    .optional(),
});

export const addCollaboratorSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['EDITOR', 'VIEWER']).default('VIEWER'),
});

export const updateCollaboratorSchema = z.object({
  role: z.enum(['EDITOR', 'VIEWER']),
});

export const updateAccessSchema = z.object({
  isPublic: z.boolean(),
});
