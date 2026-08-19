import mongoose, { Schema, type Document } from 'mongoose';
import type { IDocumentBlock } from './Document.js';

export interface IDocumentVersion extends Document {
  _id: mongoose.Types.ObjectId;
  document: mongoose.Types.ObjectId;
  title: string;
  content: IDocumentBlock[];
  editedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const documentVersionSchema = new Schema<IDocumentVersion>(
  {
    document: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
    title: { type: String, required: true },
    content: { type: Schema.Types.Mixed, default: [] },
    editedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

documentVersionSchema.index({ document: 1, createdAt: -1 });

documentVersionSchema.set('toJSON', {
  transform(_doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});

export const DocumentVersion = mongoose.model<IDocumentVersion>('DocumentVersion', documentVersionSchema);
