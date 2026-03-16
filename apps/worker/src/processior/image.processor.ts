import sharp from 'sharp';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { minioDownloadFile, minioUploadBuffer, logger } from '@dam/config';
// import { createAssetVariant } from '../services/variant.service.js';
import { AssetVariant } from '@dam/mongodb';

const ALL_IMAGE_SIZES = [
  { type: 'thumbnail', width: 400 },
  { type: 'compressed', width: 1280 },
  { type: 'optimized', width: 1920 },
] as const;

export async function processImage(
  assetId: string,
  objectKey: string,
  mimeType: string,
  requestedVariants: string[],
): Promise<void> {
  const tmp = path.join(os.tmpdir(), `${assetId}_original`);

  try {
    await minioDownloadFile(objectKey, tmp);

    const sizesToProcess = ALL_IMAGE_SIZES.filter((s) =>
      requestedVariants.includes(s.type),
    );

    for (const size of sizesToProcess) {
      try {
        const start = Date.now();
        const buffer = await sharp(tmp)
          .resize(size.width, undefined, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        const meta = await sharp(buffer).metadata();
        const variantKey = `variants/${assetId}/${size.type}.jpg`;

        await minioUploadBuffer(buffer, variantKey, 'image/jpeg');
        await AssetVariant.create({
          assetId,
          variantType: size.type,
          url: variantKey,
          fileSize: buffer.length,
          width: meta.width,
          height: meta.height,
          processingTime: Date.now() - start,
        });

        logger.info(`Image variant done: ${size.type}`, { assetId });
      } catch (err: any) {
        logger.error(`Image variant failed: ${size.type}`, {
          assetId,
          error: err.message,
        });
      }
    }
  } finally {
    await fs.unlink(tmp).catch(() => null);
  }
}
