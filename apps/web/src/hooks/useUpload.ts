import { useState, useRef, useCallback } from 'react';
import * as tus from 'tus-js-client';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'aborted';
  error?: string;
  uploadUrl?: string;
}

interface UseTusUploadOptions {
  endpoint: string;
  projectId: number;
  organizationId: number;
  uploadedBy: number;
  taskId?: number;
  parentAssetId?: string;
  tags?: string[];
  onAllDone?: () => void;
}

export function useTusUpload({
  endpoint,
  projectId,
  organizationId,
  uploadedBy,
  taskId,
  parentAssetId,
  tags = [],
  onAllDone,
}: UseTusUploadOptions) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const uploadsRef = useRef<Map<string, tus.Upload>>(new Map());

  const updateFile = useCallback((id: string, patch: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const uploadFile = useCallback(
    (uploadFile: UploadFile) => {
      const { id, file } = uploadFile;

      const upload = new tus.Upload(file, {
        endpoint,
        retryDelays: [0, 1000, 3000, 5000, 10000],
        chunkSize: 0.5 * 1024 * 1024, // 10MB

        metadata: {
          filename: encodeURIComponent(file.name),
          mimeType: file.type,
          projectId: String(projectId),
          organizationId: String(organizationId),
          uploadedBy: String(uploadedBy),
          ...(taskId && { taskId: String(taskId) }),
          ...(parentAssetId && { parentAssetId }),
          ...(tags.length && { tags: JSON.stringify(tags) }),
        },

        onError(error) {
          updateFile(id, { status: 'error', error: error.message });
        },

        onProgress(bytesUploaded, bytesTotal) {
          const progress = Math.round((bytesUploaded / bytesTotal) * 100);
          updateFile(id, { progress, status: 'uploading' });
        },

        async onSuccess() {
          updateFile(id, {
            progress: 100,
            status: 'done',
            uploadUrl: upload.url ?? undefined,
          });
          uploadsRef.current.delete(id);

          // Check if all uploads are done
          setFiles((prev) => {
            const allDone = prev
              .map((f) => (f.id === id ? { ...f, status: 'done' as const } : f))
              .every(
                (f) =>
                  f.status === 'done' ||
                  f.status === 'error' ||
                  f.status === 'aborted',
              );
            if (allDone) onAllDone?.();
            return prev;
          });
        },
      });

      uploadsRef.current.set(id, upload);

      upload.findPreviousUploads().then((previous) => {
        if (previous.length > 0) upload.resumeFromPreviousUpload(previous[0]);
        upload.start();
      });
    },
    [
      endpoint,
      projectId,
      organizationId,
      uploadedBy,
      taskId,
      parentAssetId,
      tags,
      updateFile,
      onAllDone,
    ],
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const uploadFiles: UploadFile[] = newFiles.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        progress: 0,
        status: 'pending',
      }));

      setFiles((prev) => [...prev, ...uploadFiles]);

      // Start uploading each
      uploadFiles.forEach((uf) => {
        updateFile(uf.id, { status: 'uploading' });
        uploadFile(uf);
      });
    },
    [uploadFile, updateFile],
  );

  const abortFile = useCallback(
    (id: string) => {
      const upload = uploadsRef.current.get(id);
      if (upload) {
        upload.abort();
        uploadsRef.current.delete(id);
      }
      updateFile(id, { status: 'aborted' });
    },
    [updateFile],
  );

  const removeFile = useCallback(
    (id: string) => {
      abortFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [abortFile],
  );

  const retryFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const found = prev.find((f) => f.id === id);
        if (!found) return prev;
        const updated = {
          ...found,
          status: 'uploading' as const,
          progress: 0,
          error: undefined,
        };
        uploadFile(updated);
        return prev.map((f) => (f.id === id ? updated : f));
      });
    },
    [uploadFile],
  );

  const clearDone = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.status !== 'done'));
  }, []);

  return { files, addFiles, abortFile, removeFile, retryFile, clearDone };
}
