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

export interface AssetVariant {
  _id: string;
  assetId: string;
  variantType:
    | 'thumbnail'
    | 'compressed'
    | 'optimized'
    | '480p'
    | '720p'
    | '1080p'
    | '4k';
  url: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  processingTime?: number;
  createdAt: string;
}
export interface AssetVersion {
  _id: string;
  originalName: string;
  version: number;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  uploadedBy?: { username: string };
  status: string;
}
export interface VariantsData {
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  variants: AssetVariant[];
}
