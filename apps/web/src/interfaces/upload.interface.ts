export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'aborted';
  error?: string;
  uploadUrl?: string;
}

export interface UseTusUploadOptions {
  endpoint: string;
  projectId: number;
  organizationId: number;
  uploadedBy: number;
  taskId?: number;
  parentAssetId?: string;
  tags?: string[];
  onAllDone?: () => void;
}