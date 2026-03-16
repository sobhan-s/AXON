import { logger, minioGetPresignedUrl } from '@dam/config';
import { Asset, AssetVariant } from '@dam/mongodb';
import { ApiError } from '@dam/utils';

export class AssetVariantRepository {
  async getVariantDownloadUrl(filename: string, expirySeconds = 7200) {
    try {
      const url = await minioGetPresignedUrl(filename, expirySeconds);

      return {
        url,
        expiresIn: expirySeconds,
      };
    } catch (error) {
      logger.info('Error while getting variant downloads');
      throw new ApiError(500, 'Database error while getting variant downloads');
    }
  }

  async getVariantsById(variantId: string) {
    try {
      return await AssetVariant.findOne({
        _id: variantId,
      });
    } catch (error) {
      logger.info('Error while getting variant by his id');
      throw new ApiError(500, 'Database error while getting variant his id');
    }
  }

  async getVariants(assetId: string) {
    try {
      return await AssetVariant.find({ assetId }).sort({
        createdAt: 1,
      });
    } catch (error) {
      logger.info('Error while getting variants');
      throw new ApiError(500, 'Database error while getting variants');
    }
  }
}
