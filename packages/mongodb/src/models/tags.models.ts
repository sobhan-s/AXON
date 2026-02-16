import mongoose, { Schema, Document } from 'mongoose';
import type { ITag } from '../interfaces/index.interface.js';

const TagSchema = new Schema<ITag>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    organizationId: {
      type: Number,
      required: true,
      index: true,
    },
    color: {
      type: String,
      match: /^#[0-9A-F]{6}$/i,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },

    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUsedAt: {
      type: Date,
    },

    createdBy: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'tags',
  },
);

TagSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
TagSchema.index({ organizationId: 1, usageCount: -1 });
TagSchema.index({ organizationId: 1, name: 1 });

TagSchema.methods.incrementUsage = function () {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

TagSchema.statics.findByOrganization = function (organizationId: number) {
  return this.find({ organizationId }).sort({ name: 1 });
};

TagSchema.statics.findPopular = function (
  organizationId: number,
  limit: number = 10,
) {
  return this.find({ organizationId }).sort({ usageCount: -1 }).limit(limit);
};

TagSchema.statics.findOrCreate = async function (
  organizationId: number,
  name: string,
  createdBy: number,
) {
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  let tag = await this.findOne({ organizationId, slug });

  if (!tag) {
    tag = await this.create({
      name,
      slug,
      organizationId,
      createdBy,
    });
  }

  return tag;
};

export const Tag = mongoose.model<ITag>('Tag', TagSchema);
