import { minioDeleteFile, minioGetPresignedUrl } from '@dam/config';
import { Asset } from '@dam/mongodb';
import { ApiError } from '@dam/utils';
import { Types } from 'mongoose';

export class AssetRepository {
  async getByTask(taskId: number) {
    const assets = await Asset.find({
      taskId,
      deletedAt: null,
    }).sort({ version: 1 });

    const result = await Promise.all(
      assets.map(async (asset) => {
        const originalUrl = await minioGetPresignedUrl(asset.filename, 7200);

        const thumbnailUrl = asset.thumbnailUrl
          ? await minioGetPresignedUrl(
              asset.filename.replace(/(\.[^.]+)$/, '_thumb.jpg'),
              3600,
            )
          : originalUrl;

        return {
          ...asset.toObject(),
          originalUrl,
          thumbnailUrl,
        };
      }),
    );

    return result;
  }

  async getByProject(
    projectId: number,
    filters: { fileType?: string; status?: string; isFinal?: boolean } = {},
  ) {
    const query: any = { projectId, deletedAt: null };

    if (filters.fileType) query.fileType = filters.fileType;
    if (filters.status) query.status = filters.status;
    if (filters.isFinal !== undefined) query.isFinal = filters.isFinal;

    const assets = await Asset.find(query).sort({ createdAt: -1 });

    const result = await Promise.all(
      assets.map(async (asset) => {
        const originalUrl = await minioGetPresignedUrl(asset.filename, 3600);

        const thumbnailUrl = asset.thumbnailUrl
          ? await minioGetPresignedUrl(
              asset.filename.replace(/(\.[^.]+)$/, '_thumb.jpg'),
              3600,
            )
          : originalUrl;

        return {
          ...asset.toObject(),
          originalUrl,
          thumbnailUrl,
        };
      }),
    );

    return result;
  }

  async getById(assetId: string) {
    const asset = await Asset.findOne({
      _id: assetId,
      deletedAt: null,
    });

    if (!asset) throw new ApiError(404, 'Asset not found');

    return asset;
  }

  async getVersionHistory(assetId: string) {
    const asset = await Asset.findById(assetId);

    if (!asset) throw new ApiError(404, 'Asset not found');

    const rootId = asset.parentAssetId ?? asset._id;

    const assets = await Asset.find({
      $or: [{ _id: rootId }, { parentAssetId: rootId }],
      deletedAt: null,
    }).sort({ version: 1 });

    const result = await Promise.all(
      assets.map(async (asset) => {
        const originalUrl = await minioGetPresignedUrl(asset.filename, 3600);

        const thumbnailUrl = asset.thumbnailUrl
          ? await minioGetPresignedUrl(
              asset.filename.replace(/(\.[^.]+)$/, '_thumb.jpg'),
              3600,
            )
          : originalUrl;

        return {
          ...asset.toObject(),
          originalUrl,
          thumbnailUrl,
        };
      }),
    );

    return result;
  }

  async getDownloadUrl(assetId: string, expirySeconds = 7200) {
    const asset = await Asset.findOne({
      _id: assetId,
      deletedAt: null,
    });

    if (!asset) throw new ApiError(404, 'Asset not found');

    const url = await minioGetPresignedUrl(asset.filename, expirySeconds);

    await asset.incrementDownloadCount();

    return {
      url,
      expiresIn: expirySeconds,
    };
  }

  async trackView(assetId: string) {
    const asset = await Asset.findOne({
      _id: assetId,
      deletedAt: null,
    });

    if (!asset) throw new ApiError(404, 'Asset not found');

    await asset.incrementViewCount();

    return asset;
  }

  async finalize(assetId: string) {
    const asset = await Asset.findOne({
      _id: assetId,
      deletedAt: null,
    });

    if (!asset) throw new ApiError(404, 'Asset not found');

    asset.isFinal = true;
    asset.status = 'final';
    asset.finalizedAt = new Date();

    return asset.save();
  }

  async softDelete(assetId: string) {
    const asset = await Asset.findById(assetId);

    if (!asset) throw new ApiError(404, 'Asset not found');

    await minioDeleteFile(asset.filename).catch(() => {});

    return asset.softDelete();
  }

  async updateAsset(assetId: string | Types.ObjectId, status: string) {
    const updatedAssetStatus = await Asset.findByIdAndUpdate(assetId, {
      status,
    });

    if (!updatedAssetStatus) {
      throw new ApiError(500, 'Mongodb Server problem to update the status');
    }

    return updatedAssetStatus.save();
  }
}
