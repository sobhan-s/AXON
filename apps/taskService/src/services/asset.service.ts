import sharp from 'sharp';
import { Asset } from '@dam/mongodb';
import { logger } from '@dam/config';
import {
  minioUploadFile,
  minioUploadBuffer,
  // minioGetPresignedUrl,
  // minioDeleteFile,
  minioBuildObjectName,
  minioDetectFileType,
  type TusUploadMeta,
} from '@dam/config';
import {
  createTusServer,
  tusDeleteTempFile,
  tusParseMetadata,
} from '@dam/config';
import { TaskService } from './task.service.js';

export interface UploadResult {
  assetId: string;
  originalUrl: string;
  thumbnailUrl?: string;
  filename: string;
  version: number;
  taskId?: number;
}

const taskService = new TaskService();

async function generateThumbnail(
  localPath: string,
  objectName: string,
): Promise<string | undefined> {
  try {
    const thumbName = objectName.replace(/(\.[^.]+)$/, '_thumb.jpg');
    const thumbBuffer = await sharp(localPath)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    const minIoUPloadBuffer = await minioUploadBuffer(
      thumbBuffer,
      thumbName,
      'image/jpeg',
    );

    console.log(
      'miniio ads;fkasdfjaosd ;okaj oas doadsoi jaso fdj',
      minioUploadBuffer,
    );

    return minIoUPloadBuffer;
  } catch (error) {
    logger.warn('thumbnail generation failed , so skipping this process', {
      error,
      objectName,
    });
    return undefined;
  }
}

export async function processUpload(
  _uploadId: string,
  tempPath: string,
  meta: TusUploadMeta,
  fileSize: number,
): Promise<UploadResult> {
  const projectId = Number(meta.projectId);
  const organizationId = Number(meta.organizationId);
  const uploadedBy = Number(meta.uploadedBy);
  const originalName = meta.filename;
  const mimeType = meta.mimeType;
  const taskIdMeta = meta.taskId ? Number(meta.taskId) : undefined;
  const fileType = minioDetectFileType(mimeType);
  const parsedTags = meta.tags ? (JSON.parse(meta.tags) as string[]) : [];

  let version = 1;
  let parentObjId = undefined;

  if (meta.parentAssetId) {
    const parent = await Asset.findById(meta.parentAssetId);
    if (parent) {
      version = (parent.version ?? 0) + 1;
      parentObjId = parent._id;
    }
  }

  const objectName = minioBuildObjectName(
    organizationId,
    projectId,
    taskIdMeta ?? 'upload',
    mimeType,
  );
  const originalUrl = await minioUploadFile(tempPath, objectName, mimeType);
  logger.info('Uploaded to MinIO', { objectName });

  const thumbnailUrl =
    fileType === 'image'
      ? await generateThumbnail(tempPath, objectName)
      : undefined;

  const asset = await Asset.create({
    filename: objectName,
    originalName,
    originalUrl,
    thumbnailUrl,
    fileType,
    mimeType,
    fileSize,
    taskId: taskIdMeta ?? 0,
    projectId,
    organizationId,
    uploadedBy,
    version,
    parentAssetId: parentObjId,
    status: 'review',
    processingStatus: 'completed',
    tags: parsedTags,
  });

  const assetId = asset._id.toString();
  logger.info('Asset saved to MongoDB', { assetId });

  let finalTaskId: number | undefined = taskIdMeta;

  if (!taskIdMeta) {
    const task = await taskService.createAssetBasedTask(
      projectId,
      uploadedBy,
      organizationId,
      originalName,
      assetId,
    );

    await Asset.findByIdAndUpdate(assetId, { taskId: task.id });
    finalTaskId = task.id;
    logger.info('ASSET_BASED task auto-created', { taskId: task.id, assetId });
  } else {
    await Asset.findByIdAndUpdate(assetId, { taskId: taskIdMeta });
    await taskService.linkUploadToManualTask(taskIdMeta, uploadedBy, assetId);
    logger.info('MANUAL task linked to upload', {
      taskId: taskIdMeta,
      assetId,
    });
  }

  tusDeleteTempFile(tempPath);

  return {
    assetId,
    originalUrl,
    thumbnailUrl,
    filename: originalName,
    version,
    taskId: finalTaskId,
  };
}

export const tusServer = createTusServer<UploadResult>(
  '/api/assets/upload',
  processUpload,
);
