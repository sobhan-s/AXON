import { minioDeleteFile, minioGetPresignedUrl } from '@dam/config';
import { Asset } from '@dam/mongodb';
import { ApiError } from '@dam/utils';
import { Types } from 'mongoose';

export class AssetRepository {
  async getByTask(taskId: number) {
    return Asset.find({ taskId, deletedAt: null }).sort({ version: -1 });
  }

  async getByProject(
    projectId: number,
    filters: { fileType?: string; status?: string; isFinal?: boolean } = {},
  ) {
    const query: any = { projectId, deletedAt: null };
    if (filters.fileType) query.fileType = filters.fileType;
    if (filters.status) query.status = filters.status;
    if (filters.isFinal !== undefined) query.isFinal = filters.isFinal;
    return Asset.find(query).sort({ createdAt: -1 });
  }

  async getById(assetId: string) {
    const asset = await Asset.findById(assetId);
    if (!asset) throw new ApiError(404, 'Asset not found');
    return asset;
  }

  async getVersionHistory(assetId: string) {
    const asset = await Asset.findById(assetId);
    if (!asset) throw new ApiError(404, 'Asset not found');
    const rootId = asset.parentAssetId ?? asset._id;
    return Asset.find({
      $or: [{ _id: rootId }, { parentAssetId: rootId }],
      deletedAt: null,
    }).sort({ version: 1 });
  }

  async getDownloadUrl(assetId: string, expirySeconds = 3600) {
    const asset = await Asset.findById(assetId);
    if (!asset) throw new ApiError(404, 'Asset not found');
    const url = await minioGetPresignedUrl(asset.filename, expirySeconds);
    await asset.incrementDownloadCount();
    return { url, asset };
  }

  async trackView(assetId: string) {
    const asset = await Asset.findById(assetId);
    if (!asset) throw new ApiError(404, 'Asset not found');
    await asset.incrementViewCount();
    return asset;
  }

  async finalize(assetId: string) {
    const asset = await Asset.findById(assetId);
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
    const updatedStatusAsset = await Asset.findByIdAndUpdate(assetId, {
      status,
    });
    return updatedStatusAsset?.save();
  }
}
