import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  minioDownloadFile,
  minioUploadFile,
  minioUploadBuffer,
  logger,
} from '@dam/config';
import { AssetVariant } from '@dam/mongodb';

const VIDEO_SIZES = [
  { type: '480p', width: 854, height: 480, bitrate: '1000k' },
  { type: '720p', width: 1280, height: 720, bitrate: '2500k' },
  { type: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
] as const;

export async function processVideo(
  assetId: string,
  objectKey: string,
  mimeType: string,
  requestedVariants: string[],
): Promise<void> {
  const ext = mimeType.split('/')[1] ?? 'mp4';
  const tmp = path.join(os.tmpdir(), `${assetId}_original.${ext}`);

  try {
    logger.info('Downloading video from MinIO', { assetId, objectKey });
    await minioDownloadFile(objectKey, tmp);
    logger.info('Video downloaded', { assetId });

    if (requestedVariants.includes('thumbnail')) {
      try {
        const thumbPath = path.join(os.tmpdir(), `${assetId}_thumb.jpg`);
        await extractThumbnail(tmp, thumbPath);
        const thumbBuffer = await fs.readFile(thumbPath);
        const thumbKey = `variants/${assetId}/thumbnail.jpg`;
        await minioUploadBuffer(thumbBuffer, thumbKey, 'image/jpeg');
        await AssetVariant.findOneAndUpdate(
          { assetId, variantType: 'thumbnail' },
          {
            assetId,
            variantType: 'thumbnail',
            url: thumbKey,
            fileSize: thumbBuffer.length,
          },
          { upsert: true, new: true },
        );
        await fs.unlink(thumbPath).catch(() => null);
        logger.info('Video thumbnail done', { assetId });
      } catch (err: any) {
        logger.error('Video thumbnail failed', { assetId, error: err.message });
      }
    }

    const sizesToProcess = VIDEO_SIZES.filter((s) =>
      requestedVariants.includes(s.type),
    );

    for (const size of sizesToProcess) {
      const outPath = path.join(os.tmpdir(), `${assetId}_${size.type}.mp4`);
      try {
        logger.info(`Starting transcode: ${size.type}`, { assetId });
        const start = Date.now();

        await transcodeVideo(tmp, outPath, size);

        const stats = await fs.stat(outPath);
        const variantKey = `variants/${assetId}/${size.type}.mp4`;

        logger.info(`Uploading variant: ${size.type}`, {
          assetId,
          fileSize: stats.size,
        });
        await minioUploadFile(outPath, variantKey, 'video/mp4');

        await AssetVariant.findOneAndUpdate(
          { assetId, variantType: size.type },
          {
            assetId,
            variantType: size.type,
            url: variantKey,
            fileSize: stats.size,
            processingTime: Date.now() - start,
          },
          { upsert: true, new: true },
        );

        logger.info(`Video variant done: ${size.type}`, {
          assetId,
          ms: Date.now() - start,
        });
      } catch (err: any) {
        logger.error(`Video variant failed: ${size.type}`, {
          assetId,
          error: err.message,
        });
      } finally {
        await fs.unlink(outPath).catch(() => null);
      }
    }
  } finally {
    await fs.unlink(tmp).catch(() => null);
  }
}

function extractThumbnail(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: ['00:00:01'],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '400x?',
      })
      .on('end', () => resolve())
      .on('error', (err) =>
        reject(new Error(`ffmpeg thumbnail: ${err.message}`)),
      );
  });
}

function transcodeVideo(
  inputPath: string,
  outputPath: string,
  cfg: { width: number; height: number; bitrate: string },
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('copy')
      .outputOptions([
        `-vf scale=${cfg.width}:-2`,
        `-b:v ${cfg.bitrate}`,
        '-preset fast',
        '-movflags +faststart',
        '-pix_fmt yuv420p',
      ])
      .on('start', (cmd) => logger.info('ffmpeg started', { cmd }))
      .on('progress', (p) =>
        logger.info('ffmpeg progress', { percent: p.percent?.toFixed(1) }),
      )
      .on('end', () => resolve())
      .on('error', (err) => reject(new Error(`ffmpeg: ${err.message}`)))
      .save(outputPath);
  });
}
