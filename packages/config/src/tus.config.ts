import { Server as TusServer } from '@tus/server';
import { FileStore } from '@tus/file-store';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { logger } from './logger.config.js';
import { ALLOWED_MIME_TYPES, MINIO_MAX_FILE_SIZE } from './minio.config.js';

export const TUS_TMP_DIR = env_config_variable.TEMP_DIR.PATH
  ? path.resolve(env_config_variable.TEMP_DIR.PATH)
  : path.join(os.tmpdir(), 'tus-uploads');

export function tusMakeTmpDir(): void {
  if (!fs.existsSync(TUS_TMP_DIR)) {
    fs.mkdirSync(TUS_TMP_DIR, { recursive: true });
    logger.info(`directory of tus of temp is reasy: ${TUS_TMP_DIR}`);
  }
}

export interface TusUploadMeta {
  projectId: string;
  organizationId: string;
  uploadedBy: string;
  filename: string;
  mimeType: string;
  taskId?: string;
  parentAssetId?: string;
  tags?: string;
}

export function tusParseMetadata(
  raw: Record<string, string> = {},
): TusUploadMeta {
  return {
    projectId: raw.projectId ?? '',
    organizationId: raw.organizationId ?? '',
    uploadedBy: raw.uploadedBy ?? '',
    filename: raw.filename ? decodeURIComponent(raw.filename) : 'file',
    mimeType: raw.mimeType ?? 'application/octet-stream',
    taskId: raw.taskId,
    parentAssetId: raw.parentAssetId,
    tags: raw.tags,
  };
}

function validateMetadata(meta: TusUploadMeta): string | null {
  if (!meta.projectId) return 'Missing projectId';
  if (!meta.organizationId) return 'Missing organizationId';
  if (!meta.uploadedBy) return 'Missing uploadedBy';
  if (!meta.filename) return 'Missing filename';
  if (!meta.mimeType) return 'Missing mimeType';
  if (!ALLOWED_MIME_TYPES.has(meta.mimeType)) {
    return `File type "${meta.mimeType}" is not supported`;
  }
  return null;
}

export type TusFinishHandler<T = void> = (
  uploadId: string,
  tempPath: string,
  meta: TusUploadMeta,
  fileSize: number,
) => Promise<T>;

export function createTusServer<T>(
  path: string, // e.g. '/api/assets/upload
  onFinish: TusFinishHandler<T>,
): TusServer {
  tusMakeTmpDir();

  const server = new TusServer({
    path,
    datastore: new FileStore({ directory: TUS_TMP_DIR }),

    onUploadCreate: async (req, upload) => {
      const meta = tusParseMetadata(upload.metadata as any);
      const error = validateMetadata(meta);

      if (error) {
        logger.warn('TUS upload rejected', { error, meta });
        throw { status_code: 400, body: error };
      }

      if (upload.size && upload.size > MINIO_MAX_FILE_SIZE) {
        throw {
          status_code: 413,
          body: `File too large. Max allowed: ${MINIO_MAX_FILE_SIZE / 1024 ** 3}GB`,
        };
      }

      logger.info('TUS upload started', {
        uploadId: upload.id,
        filename: meta.filename,
        size: upload.size,
      });

      return { metadata: upload.metadata };
    },

    onUploadFinish: async (req, upload) => {
      const meta = tusParseMetadata(upload.metadata as any);
      const tempPath = path_module.join(TUS_TMP_DIR, upload.id);
      const fileSize = upload.size ?? 0;

      logger.info('TUS upload complete', {
        uploadId: upload.id,
        filename: meta.filename,
        fileSize,
      });

      try {
        await onFinish(upload.id, tempPath, meta, fileSize);
      } catch (error) {
        logger.error('TUS finish handler error', {
          error,
          uploadId: upload.id,
        });
      }

      // Return an empty object or custom headers/body
      return {};
    },
  });

  return server;
}

import path_module from 'path';
import { promises } from 'dns';
import { env_config_variable } from './env.config.js';

export function tusDeleteTempFile(tempPath: string): void {
  fs.unlink(tempPath, (err) => {
    if (err && err.code !== 'ENOENT') {
      logger.warn('Failed to delete TUS temp file', { tempPath });
    }
  });
}

export function tusCleanupStaleFiles(maxAgeHours = 24): void {
  try {
    const files = fs.readdirSync(TUS_TMP_DIR);
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
    let removed = 0;

    for (const file of files) {
      const filePath = path_module.join(TUS_TMP_DIR, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.mtimeMs < cutoff) {
          fs.unlinkSync(filePath);
          removed++;
        }
      } catch {
        // file already gone — skip
      }
    }

    if (removed > 0) {
      logger.info(`TUS cleanup: removed ${removed} stale temp files`);
    }
  } catch (error) {
    logger.error('TUS cleanup error', { error });
  }
}
