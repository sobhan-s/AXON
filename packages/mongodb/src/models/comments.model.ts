import mongoose, { Schema, Types } from 'mongoose';
import { IComment } from '../interfaces/index.interface';

const CommentSchema = new Schema<IComment>(
  {
    taskId: {
      type: Number,
      index: true,
      sparse: true,
    },
    assetId: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
      index: true,
      sparse: true,
    },
    userId: {
      type: Number,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    mentions: [
      {
        type: Number,
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
      index: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    collection: 'comments',
  },
);

CommentSchema.pre('validate', async function (this: IComment) {
  // Ensure at least one of taskId or assetId exists
  if (!this.taskId && !this.assetId) {
    throw new Error('Comment must be attached to either a task or asset');
  }
});

CommentSchema.index({ taskId: 1, createdAt: -1 });
CommentSchema.index({ assetId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ deletedAt: 1 }, { sparse: true });

CommentSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

CommentSchema.statics.findByTask = function (taskId: number) {
  return this.find({ taskId, deletedAt: null }).sort({ createdAt: 1 });
};

CommentSchema.statics.findByAsset = function (assetId: Types.ObjectId) {
  return this.find({ assetId, deletedAt: null }).sort({ createdAt: 1 });
};

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
