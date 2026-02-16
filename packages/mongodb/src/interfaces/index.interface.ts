import mongoose, { Document, Types } from 'mongoose';

export interface IAsset extends Document {
  _id: Types.ObjectId;

  // File info
  filename: string;
  originalName: string;
  originalUrl: string;
  thumbnailUrl?: string;
  fileType: 'image' | 'video' | 'document';
  mimeType: string;
  fileSize: number;

  // PostgreSQL references (stored as numbers)
  taskId: number;
  moduleId: number;
  projectId: number;
  organizationId: number;
  uploadedBy: number;

  // Versioning
  version: number;
  parentAssetId?: Types.ObjectId;
  isFinal: boolean;

  // Status
  status: 'draft' | 'review' | 'approved' | 'rejected' | 'final';
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;

  // Metadata
  tags: string[];
  expiryDate?: Date;
  usageRights?: {
    regions?: string[];
    channels?: string[];
    licenseType?: string;
    restrictions?: string;
  };

  downloadCount: number;
  viewCount: number;
  lastDownloadedAt?: Date;
  lastViewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
  finalizedAt?: Date;
  deletedAt?: Date;

  incrementDownloadCount(): Promise<this>;
  incrementViewCount(): Promise<this>;
  softDelete(): Promise<this>;
}

export interface IAssetVariant extends Document {
  _id: Types.ObjectId;
  assetId: Types.ObjectId;
  variantType:
    | 'thumbnail'
    | '480p'
    | '720p'
    | '1080p'
    | '4k'
    | 'compressed'
    | 'optimized';
  url: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  processingTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment extends Document {
  _id: Types.ObjectId;

  // Can be attached to task OR asset (one must be present)
  taskId?: number;
  assetId?: Types.ObjectId;

  userId: number;
  text: string;
  mentions: number[];

  isEdited: boolean;
  editedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  // Methods
  softDelete(): Promise<this>;
}

export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_overdue'
  | 'task_mentioned'
  | 'asset_uploaded'
  | 'asset_approved'
  | 'asset_rejected'
  | 'asset_finalized'
  | 'asset_expiring'
  | 'comment_added'
  | 'comment_reply'
  | 'comment_mentioned'
  | 'approval_requested'
  | 'approval_received'
  | 'team_member_added'
  | 'storage_warning'
  | 'system_maintenance';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;

  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;

  relatedEntityType?: string;
  relatedEntityId?: string;

  actorId?: number;
  metadata?: Record<string, any>;

  isRead: boolean;
  readAt?: Date;

  emailSent: boolean;
  emailSentAt?: Date;

  createdAt: Date;
  deletedAt?: Date;

  // Methods
  markAsRead(): Promise<this>;
  softDelete(): Promise<this>;
}

export interface ITag extends Document {
  _id: mongoose.Types.ObjectId;

  name: string;
  slug: string;
  organizationId: number;
  color?: string;
  description?: string;

  usageCount: number;
  lastUsedAt?: Date;

  createdBy: number;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  incrementUsage(): Promise<this>;
}
