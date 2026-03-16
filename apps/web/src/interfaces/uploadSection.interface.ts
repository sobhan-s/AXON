export interface UploadSectionProps {
  projectId: number;
  organizationId: number;
  uploadedBy: number;
  taskId?: number;
  parentAssetId?: string;
  tags?: string[];
  onUploadDone?: () => void;
}