import * as Minio from 'minio';
import { logger } from './logger.config.js';
import { env_config_variable } from './env.config.js';

export const minioClient = new Minio.Client({
  endPoint: env_config_variable.MINIO.MINIO_ENDPOINT,
  port: Number(env_config_variable.MINIO.MINIO_PORT ?? 9000),
  useSSL: env_config_variable.MINIO.MINIO_USESSL,
  accessKey: env_config_variable.MINIO.MINIO_ROOTUSER,
  secretKey: env_config_variable.MINIO.MINIO_PASSWORD,
});

export const MINIO_BUCKET =
  env_config_variable.MINIO.MINIO_BUCKET_NAME ?? 'axon-assets';

export async function initMinio(): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(MINIO_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(MINIO_BUCKET);
      logger.info(`MinIO: bucket "${MINIO_BUCKET}" created`);
    } else {
      logger.info(`MinIO: bucket "${MINIO_BUCKET}" ready`);
    }
  } catch (error) {
    logger.error('MinIO init failed', { error });
    throw error;
  }
}

export async function minioUploadFile(
  localPath: string,
  objectName: string,
  mimeType: string,
): Promise<string> {
  await minioClient.fPutObject(MINIO_BUCKET, objectName, localPath, {
    'Content-Type': mimeType,
  });
  return minioBuildPublicUrl(objectName);
}

export async function minioUploadBuffer(
  buffer: Buffer,
  objectName: string,
  mimeType: string,
): Promise<string> {
  await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
    'Content-Type': mimeType,
  });
  return minioBuildPublicUrl(objectName);
}

export async function minioGetPresignedUrl(
  objectName: string,
  expirySeconds = 3600,
): Promise<string> {
  return minioClient.presignedGetObject(
    MINIO_BUCKET,
    objectName,
    expirySeconds,
  );
}

export async function minioDeleteFile(objectName: string): Promise<void> {
  await minioClient.removeObject(MINIO_BUCKET, objectName);
}

export function minioBuildPublicUrl(objectName: string): string {
  return `${env_config_variable.MINIO.MINIO_PUBLI_URL}/${MINIO_BUCKET}/${objectName}`;
}

export function minioBuildObjectName(
  orgId: number,
  projectId: number,
  taskId: number | string,
  mimeType: string,
): string {
  const ext = MIME_TO_EXT[mimeType] ?? 'bin';
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${orgId}/${projectId}/${taskId}/${uid}.${ext}`;
}

export async function minioDownloadFile(
  objectName: string,
  localPath: string,
): Promise<void> {
  await minioClient.fGetObject(MINIO_BUCKET, objectName, localPath);
}

export function minioDetectFileType(
  mimeType: string,
): 'image' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}

export const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

export const ALLOWED_MIME_TYPES = new Set(Object.keys(MIME_TO_EXT));

export const MINIO_MAX_FILE_SIZE = Number(
  process.env.MAX_FILE_SIZE ?? 10 * 1024 * 1024 * 1024, 
);
