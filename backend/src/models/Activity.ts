import mongoose, { Schema, type Document } from 'mongoose';

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'EDIT' | 'PERMISSION_CHANGE' | 'CREATE' | 'DELETE' | 'WORKSPACE' | 'EXPORT';
  actorId: mongoose.Types.ObjectId;
  actorName: string;
  targetId: mongoose.Types.ObjectId;
  targetTitle: string;
  targetType: 'document' | 'workspace';
  details: string;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: ['EDIT', 'PERMISSION_CHANGE', 'CREATE', 'DELETE', 'WORKSPACE', 'EXPORT'],
      required: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    targetTitle: { type: String, required: true },
    targetType: { type: String, enum: ['document', 'workspace'], required: true },
    details: { type: String, required: true },
  },
  { timestamps: true }
);

activitySchema.index({ actorId: 1, createdAt: -1 });
activitySchema.index({ targetId: 1 });

activitySchema.set('toJSON', {
  transform(_doc, ret) {
    delete (ret as any).__v;
    return ret;
  },
});

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);
