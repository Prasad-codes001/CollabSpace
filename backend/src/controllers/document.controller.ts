import type { Request, Response } from 'express';
import { documentService } from '../services/document.service.js';
import {
  createDocumentSchema,
  updateDocumentSchema,
  addCollaboratorSchema,
  updateCollaboratorSchema,
  updateAccessSchema,
} from '../validators/document.validator.js';
import { ApiError } from '../utils/ApiError.js';
import type { AuthenticatedRequest } from '../types.js';

export const documentController = {
  async create(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const parsed = createDocumentSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, parsed.error.errors[0].message);

    const doc = await documentService.create(
      authReq.user.id,
      parsed.data.title,
      parsed.data.type,
      parsed.data.workspaceId
    );
    res.status(201).json(doc);
  },

  async list(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const filter = (req.query.filter as string) || 'all';
    const workspaceId = req.query.workspaceId as string | undefined;
    const docs = await documentService.getDocuments(authReq.user.id, filter, workspaceId);
    res.json(docs);
  },

  async getById(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const doc = await documentService.getById(req.params.id as string, authReq.user.id);
    res.json(doc);
  },

  async update(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const parsed = updateDocumentSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, parsed.error.errors[0].message);

    const doc = await documentService.update(req.params.id as string, authReq.user.id, parsed.data);
    res.json(doc);
  },

  async trash(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const result = await documentService.trash(req.params.id as string, authReq.user.id);
    res.json(result);
  },

  async restore(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const result = await documentService.restore(req.params.id as string, authReq.user.id);
    res.json(result);
  },

  async deletePermanent(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const result = await documentService.deletePermanent(req.params.id as string, authReq.user.id);
    res.json(result);
  },

  async toggleStar(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const result = await documentService.toggleStar(req.params.id as string, authReq.user.id);
    res.json(result);
  },

  async joinByLink(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const result = await documentService.joinByLink(req.params.id as string, authReq.user.id);
    res.json(result);
  },

  // --- Collaborator management ---

  async addCollaborator(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const parsed = addCollaboratorSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, parsed.error.errors[0].message);

    const result = await documentService.addCollaborator(
      req.params.id as string,
      authReq.user.id,
      parsed.data.email,
      parsed.data.role
    );
    res.status(201).json(result);
  },

  async updateCollaborator(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const parsed = updateCollaboratorSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, parsed.error.errors[0].message);

    const result = await documentService.updateCollaboratorRole(
      req.params.id as string,
      authReq.user.id,
      req.params.userId as string,
      parsed.data.role
    );
    res.json(result);
  },

  async removeCollaborator(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const result = await documentService.removeCollaborator(
      req.params.id as string,
      authReq.user.id,
      req.params.userId as string
    );
    res.json(result);
  },

  async updateAccess(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const parsed = updateAccessSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, parsed.error.errors[0].message);

    const result = await documentService.updateAccess(
      req.params.id as string,
      authReq.user.id,
      parsed.data.isPublic
    );
    res.json(result);
  },

  // --- Version history ---

  async createVersion(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const result = await documentService.createVersion(req.params.id as string, authReq.user.id);
    res.status(201).json(result);
  },

  async listVersions(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const versions = await documentService.listVersions(req.params.id as string, authReq.user.id);
    res.json(versions);
  },

  async getVersion(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const version = await documentService.getVersion(
      req.params.id as string,
      req.params.versionId as string,
      authReq.user.id
    );
    res.json(version);
  },

  // --- Export ---

  async exportDoc(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const format = req.params.format as string;
    const result = await documentService.exportDocument(req.params.id as string, authReq.user.id, format);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="document.${format}"`);
    res.send(result.content);
  },
};
