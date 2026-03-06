export interface FinalizedAsset {
  _id: string;
  originalName: string;
  mimeType: string;
  fileSize?: number;
  size?: number;
  status: string;
  isFinal: boolean;
  version?: number;
  viewCount?: number;
  createdAt: string;
  taskId?: number;
  uploadedBy?: { username?: string };
  tags?: string[];
}