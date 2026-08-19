import mongoose, { Schema, type Document as MongoDoc } from 'mongoose';

export interface IDocumentBlock {
  id: string;
  type: string;
  content: string;
}

export interface IDocumentCollaborator {
  user: mongoose.Types.ObjectId;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  addedAt: Date;
}

export interface IDocument extends MongoDoc {
  _id: mongoose.Types.ObjectId;
  title: string;
  type: 'blank' | 'template' | 'docx' | 'markdown' | 'pdf';
  owner: mongoose.Types.ObjectId;
  workspaceId?: mongoose.Types.ObjectId;
  content: IDocumentBlock[];
  isPublic: boolean;
  isTrashed: boolean;
  trashedAt?: Date;
  starredBy: mongoose.Types.ObjectId[];
  collaborators: IDocumentCollaborator[];
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const documentBlockSchema = new Schema<IDocumentBlock>(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String, default: '' },
  },
  { _id: false }
);

const documentCollaboratorSchema = new Schema<IDocumentCollaborator>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['OWNER', 'EDITOR', 'VIEWER'], required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['blank', 'template', 'docx', 'markdown', 'pdf'], default: 'blank' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace' },
    content: { type: [documentBlockSchema], default: [] },
    isPublic: { type: Boolean, default: false },
    isTrashed: { type: Boolean, default: false },
    trashedAt: { type: Date },
    starredBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    collaborators: { type: [documentCollaboratorSchema], default: [] },
    fileUrl: { type: String },
  },
  { timestamps: true }
);

documentSchema.index({ owner: 1, isTrashed: 1 });
documentSchema.index({ workspaceId: 1 });
documentSchema.index({ 'collaborators.user': 1 });
documentSchema.index({ starredBy: 1 });

documentSchema.set('toJSON', {
  transform(_doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});

export const Document = mongoose.model<IDocument>('Document', documentSchema);
