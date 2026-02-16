import mongoose, { Schema, Document } from 'mongoose';
import type { INotification } from '../interfaces/index.interface.js';

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Number,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'task_assigned',
        'task_completed',
        'task_overdue',
        'task_mentioned',
        'asset_uploaded',
        'asset_approved',
        'asset_rejected',
        'asset_finalized',
        'asset_expiring',
        'comment_added',
        'comment_reply',
        'comment_mentioned',
        'approval_requested',
        'approval_received',
        'team_member_added',
        'storage_warning',
        'system_maintenance',
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
    },

    relatedEntityType: {
      type: String,
    },
    relatedEntityId: {
      type: String,
    },

    actorId: {
      type: Number,
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },

    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
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
    collection: 'notifications',
  },
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ deletedAt: 1 }, { sparse: true });

NotificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

NotificationSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

NotificationSchema.statics.findUnreadByUser = function (userId: number) {
  return this.find({
    userId,
    isRead: false,
    deletedAt: null,
  }).sort({ createdAt: -1 });
};

NotificationSchema.statics.getUnreadCount = function (userId: number) {
  return this.countDocuments({
    userId,
    isRead: false,
    deletedAt: null,
  });
};

NotificationSchema.statics.markAllAsRead = async function (userId: number) {
  return this.updateMany(
    { userId, isRead: false, deletedAt: null },
    { $set: { isRead: true, readAt: new Date() } },
  );
};

export const Notification = mongoose.model<INotification>(
  'Notification',
  NotificationSchema,
);
