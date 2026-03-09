import { processImage } from './processior/image.processor.js';
import { processVideo } from './processior/video.processor.js';
import { Asset } from '@dam/mongodb';
import { logger } from '@dam/config';

export interface AssetProcessJob {
  assetId: string;
  objectKey: string;
  mimeType: string;
  fileType: 'image' | 'video' | 'document';
  variants: string[];
}

export async function processAsset(job: AssetProcessJob): Promise<void> {
  const { assetId, objectKey, mimeType, fileType, variants } = job;

  logger.info('Processing asset', { assetId, fileType, variants });

  await Asset.findByIdAndUpdate(assetId, { processingStatus: 'processing' });

  try {
    if (fileType === 'image') {
      await processImage(assetId, objectKey, mimeType, variants);
    } else if (fileType === 'video') {
      await processVideo(assetId, objectKey, mimeType, variants);
    }

    await Asset.findByIdAndUpdate(assetId, { processingStatus: 'completed' });
    logger.info('Asset processing done', { assetId });
  } catch (error: any) {
    await Asset.findByIdAndUpdate(assetId, {
      processingStatus: 'failed',
      processingError: error.message,
    });
    throw error;
  }
}
