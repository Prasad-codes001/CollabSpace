import mongoose, { Schema, type Document } from 'mongoose';

export interface IOrgSettings extends Document {
  _id: mongoose.Types.ObjectId;
  requireTwoFactor: boolean;
  allowPublicLinks: boolean;
  ssoProvider: 'OKTA' | 'GOOGLE' | 'DISABLED';
  sessionTimeoutMinutes: number;
}

const orgSettingsSchema = new Schema<IOrgSettings>(
  {
    requireTwoFactor: { type: Boolean, default: false },
    allowPublicLinks: { type: Boolean, default: false },
    ssoProvider: { type: String, enum: ['OKTA', 'GOOGLE', 'DISABLED'], default: 'DISABLED' },
    sessionTimeoutMinutes: { type: Number, default: 480 },
  },
  { timestamps: true }
);

orgSettingsSchema.set('toJSON', {
  transform(_doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});

export const OrgSettings = mongoose.model<IOrgSettings>('OrgSettings', orgSettingsSchema);
