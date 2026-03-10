export interface Approval {
  id: number;
  taskId: number;
  assetId: string;
  status: string;
  requestedAt: string;
  requestedBy?: { username: string };
  reviewedBy?: { username: string } | null;
}

export interface AssetItem {
  _id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  isFinal: boolean;
  viewCount?: number;
  createdAt: string;
  uploadedBy?: { username?: string };
  parentAssetId?: string | null;
  version?: number;
}