import { logger } from '@dam/config';
import { asyncHandler } from '@dam/utils';
import { AssetRepository } from '@dam/repository';

export class AssetService {
  private assetRepo: AssetRepository;

  constructor() {
    this.assetRepo = new AssetRepository();
  }

  async getAssetsByTask(taskId: number) {
    logger.info('Fetch all assets belong to task');

    return await this.assetRepo.getByTask(taskId);
  }

  async getByProjects(
    projectId: number,
    fileType?: string,
    status?: string,
    isFinal?: string,
  ) {
    logger.info('fetching assets with criteria of a project level');

    const assets = await this.assetRepo.getByProject(Number(projectId), {
      fileType: fileType as string,
      status: status as string,
      isFinal: isFinal === 'true',
    });

    return assets;
  }

  async getAssetById(assetId: string) {
    logger.info('fetching asset by there id');

    return await this.assetRepo.getById(assetId);
  }

  async getVersionHistory(assetId: string) {
    logger.info('fetching version history of assets');

    return await this.assetRepo.getVersionHistory(String(assetId));
  }

  async getDownloadUrl(assetId: string, expiry: number) {
    logger.info('get downlaod url of assetId');

    return await this.assetRepo.getDownloadUrl(assetId, expiry);
  }

  async viewUrl(assetId: string) {
    logger.info('create view tracked of assetId');

    return await this.assetRepo.trackView(assetId);
  }

  async finalizeImage(assetId: string) {
    logger.info('finalize the asset');

    return await this.assetRepo.finalize(assetId);
  }

  async deleteImageSoft(assetId: string) {
    logger.info('delete the image soft . . .');

    return await this.assetRepo.softDelete(assetId);
  }
}
