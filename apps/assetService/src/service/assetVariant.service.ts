import { logger } from '@dam/config';
import { Asset, AssetVariant } from '@dam/mongodb';
import { ApiError } from '@dam/utils';
import { AssetRepository, AssetVariantRepository } from '@dam/repository';

export class AssetVariantService {
  private assetRepo: AssetRepository;
  private assetVariantsRepo: AssetVariantRepository;

  constructor() {
    this.assetRepo = new AssetRepository();
    this.assetVariantsRepo = new AssetVariantRepository();
  }

  async getVarinats(assetId: string) {
    logger.info('fetching the details of varinat ');

    const [asset, variants] = await Promise.all([
      Asset.findById(assetId, 'processingStatus processingError'),
      AssetVariant.find({ assetId }).sort({ createdAt: 1 }),
      // this.assetVariantsRepo.getVariants(assetId),
    ]);

    if (!asset) {
      throw new ApiError(404, 'Assset not found');
    }

    return {
      asset,
      variants,
    };
  }

  async getVariantDownloadUrl(variantId: string) {
    logger.info('get the download url of variants of id');

    const variant = await this.assetVariantsRepo.getVariantsById(variantId);

    if (!variant) {
      throw new ApiError(404, 'Variant is not found');
    }

    return await this.assetVariantsRepo.getVariantDownloadUrl(variant.url);
  }
}
