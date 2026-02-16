import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IAsset } from '../interfaces/index.interface.js';

const AssetSchema = new Schema<IAsset>(
  {
    // File info
    filename: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    originalUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    fileType: {
      type: String,
      enum: ['image', 'video', 'document'],
      required: true,
      index: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },

    // PostgreSQL references
    taskId: {
      type: Number,
      required: true,
      index: true,
    },
    moduleId: {
      type: Number,
      required: true,
      index: true,
    },
    projectId: {
      type: Number,
      required: true,
      index: true,
    },
    organizationId: {
      type: Number,
      required: true,
      index: true,
    },
    uploadedBy: {
      type: Number,
      required: true,
      index: true,
    },

    // Versioning
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    parentAssetId: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
      index: true,
    },
    isFinal: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Status
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'rejected', 'final'],
      default: 'draft',
      index: true,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    processingError: {
      type: String,
    },

    // Metadata
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    expiryDate: {
      type: Date,
      index: true,
    },
    usageRights: {
      regions: [String],
      channels: [String],
      licenseType: String,
      restrictions: String,
    },

    // Tracking
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastDownloadedAt: {
      type: Date,
    },
    lastViewedAt: {
      type: Date,
    },

    // Soft delete
    finalizedAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'assets',
  },
);

AssetSchema.index({ taskId: 1, version: -1 });
AssetSchema.index({ status: 1, isFinal: 1 });
AssetSchema.index({ organizationId: 1, createdAt: -1 });
AssetSchema.index({ projectId: 1, fileType: 1 });
AssetSchema.index({ uploadedBy: 1, createdAt: -1 });
AssetSchema.index({ tags: 1 });

AssetSchema.index({ organizationId: 1, isFinal: 1, fileType: 1 });
AssetSchema.index({ projectId: 1, status: 1, createdAt: -1 });
AssetSchema.index({ moduleId: 1, status: 1 });

AssetSchema.index({
  filename: 'text',
  originalName: 'text',
  tags: 'text',
});

AssetSchema.methods.incrementDownloadCount = function () {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  return this.save();
};

AssetSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  this.lastViewedAt = new Date();
  return this.save();
};

AssetSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

AssetSchema.statics.findByTask = function (taskId: number) {
  return this.find({ taskId, deletedAt: null }).sort({ version: -1 });
};

AssetSchema.statics.findFinalized = function (filters: any = {}) {
  return this.find({
    ...filters,
    isFinal: true,
    deletedAt: null,
  }).sort({ finalizedAt: -1 });
};

AssetSchema.statics.findExpiring = function (days: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    expiryDate: { $lte: futureDate, $gte: new Date() },
    deletedAt: null,
    isFinal: true,
  }).sort({ expiryDate: 1 });
};

AssetSchema.statics.findByProject = function (
  projectId: number,
  filters: any = {},
) {
  return this.find({
    projectId,
    deletedAt: null,
    ...filters,
  }).sort({ createdAt: -1 });
};

export const Asset = mongoose.model<IAsset>('Asset', AssetSchema);
