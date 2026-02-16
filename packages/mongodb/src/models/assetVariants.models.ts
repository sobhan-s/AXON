import mongoose, { Schema, Document, Types } from 'mongoose';
import type { IAssetVariant } from '../interfaces/index.interface.js';

const AssetVariantSchema = new Schema<IAssetVariant>(
  {
    assetId: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
      index: true,
    },
    variantType: {
      type: String,
      enum: [
        'thumbnail',
        '480p',
        '720p',
        '1080p',
        '4k',
        'compressed',
        'optimized',
      ],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      min: 0,
    },
    width: {
      type: Number,
      min: 0,
    },
    height: {
      type: Number,
      min: 0,
    },
    duration: {
      type: Number,
      min: 0,
    },
    processingTime: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'asset_variants',
  },
);

AssetVariantSchema.index({ assetId: 1, variantType: 1 }, { unique: true });
AssetVariantSchema.index({ assetId: 1 });

AssetVariantSchema.statics.findByAsset = function (assetId: Types.ObjectId) {
  return this.find({ assetId }).sort({ createdAt: 1 });
};

AssetVariantSchema.statics.findByType = function (
  assetId: Types.ObjectId,
  variantType: string,
) {
  return this.findOne({ assetId, variantType });
};

export const AssetVariant = mongoose.model<IAssetVariant>(
  'AssetVariant',
  AssetVariantSchema,
);
