import sharp from 'sharp';
import { Asset } from '@dam/mongodb';
import { logger } from '@dam/config';
import {
  minioUploadBuffer,
  minioBuildObjectName,
  minioDetectFileType,
  minioGetBuffer,
  minioCopyObject,
  minioDeleteObject,
  type TusUploadMeta,
} from '@dam/config';
import { createTusServer } from '@dam/config';
import { TaskHelperService } from './taskHelper.service.js';
import { TaskRepository } from '@dam/repository';

export interface UploadResult {
  assetId: string;
  originalUrl: string;
  thumbnailUrl?: string;
  filename: string;
  version: number;
  taskId?: number;
}

const taskService = new TaskHelperService();
const taskRepo = new TaskRepository();

async function generateThumbnail(
  sourceBuffer: Buffer,
  objectName: string,
): Promise<string | undefined> {
  try {
    const thumbName = objectName.replace(/(\.[^.]+)$/, '_thumb.jpg');
    const thumbBuffer = await sharp(sourceBuffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    return await minioUploadBuffer(thumbBuffer, thumbName, 'image/jpeg');
  } catch (error) {
    logger.warn('Thumbnail generation failed, skipping', { error, objectName });
    return undefined;
  }
}

export async function processUpload(
  uploadId: string,
  s3Key: string,
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
  let parentObjId: any = undefined;
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

  const originalUrl = await minioCopyObject(s3Key, objectName, mimeType);
  logger.info('Copied to final MinIO key', { from: s3Key, to: objectName });

  let thumbnailUrl: string | undefined;
  if (fileType === 'image') {
    const sourceBuffer = await minioGetBuffer(s3Key);
    thumbnailUrl = await generateThumbnail(sourceBuffer, objectName);
  }

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
    status: 'draft',
    processingStatus: 'completed',
    tags: parsedTags,
  });

  const assetId = asset._id.toString();
  logger.info('Asset saved to MongoDB', { assetId });

  await taskRepo.updateOrgStorage(organizationId, fileSize);

  let finalTaskId: number | undefined = taskIdMeta;
  if (!taskIdMeta) {
    const task = await taskService.createAssetBasedTask(
      projectId,
      uploadedBy,
      organizationId,
      originalName,
      assetId,
    );
    await Asset.findByIdAndUpdate(assetId, {
      taskId: task.id,
      status: 'review',
    });
    finalTaskId = task.id;
    logger.info('ASSET_BASED task auto-created', { taskId: task.id, assetId });
  } else {
    await Asset.findByIdAndUpdate(assetId, { taskId: taskIdMeta });
    await taskService.updateTaskAsset(taskIdMeta, assetId);
    logger.info('Re-upload linked to existing task', {
      taskId: taskIdMeta,
      assetId,
    });
  }

  await minioDeleteObject(s3Key);
  logger.info('Deleted TUS staging object', { s3Key });

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
