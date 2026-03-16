import { rabbitPublish, logger, QUEUES } from '@dam/config';
import { AssetVariant } from '@dam/mongodb';
import { Asset } from '@dam/mongodb';
import { ApiError } from '@dam/utils';

export type VariantType =
  | 'thumbnail'
  | 'compressed'
  | 'optimized'
  | '480p'
  | '720p'
  | '1080p'
  | '4k';

export async function queueAssetProcessing(
  assetId: string,
  requestedVariants: VariantType[],
): Promise<{ queued: string[]; alreadyExist: string[] }> {
  const asset = await Asset.findById(assetId);
  if (!asset) throw new ApiError(404, 'Asset not found');

  if (!['image', 'video'].includes(asset.fileType)) {
    throw new ApiError(
      400,
      'Variants can only be generated for images and videos',
    );
  }

  const existing = await AssetVariant.find({
    assetId,
    variantType: { $in: requestedVariants },
  });
  const alreadyExist = existing.map((v) => v.variantType);
  const toProcess = requestedVariants.filter((v) => !alreadyExist.includes(v));

  if (toProcess.length === 0) {
    return { queued: [], alreadyExist };
  }

  rabbitPublish(QUEUES.ASSET_PROCESS, {
    assetId,
    objectKey: asset.filename,
    mimeType: asset.mimeType,
    fileType: asset.fileType,
    variants: toProcess,
  });

  logger.info('Variant job queued', { assetId, toProcess });

  return { queued: toProcess, alreadyExist };
}
