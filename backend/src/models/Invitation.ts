import mongoose, { Schema, type Document } from 'mongoose';
import crypto from 'node:crypto';

export interface IInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  invitedEmail: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    invitedEmail: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['OWNER', 'EDITOR', 'VIEWER'], default: 'VIEWER' },
    token: { type: String, unique: true },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'], default: 'PENDING' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Generate a unique token before saving
invitationSchema.pre('save', function (next) {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

invitationSchema.set('toJSON', {
  transform(_doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});

export const Invitation = mongoose.model<IInvitation>('Invitation', invitationSchema);
