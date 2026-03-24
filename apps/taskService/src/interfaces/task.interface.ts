export interface AssetUploadMeta {
  taskId?: number; 
  projectId: number;
  organizationId: number;
  uploadedBy: number;
  filename: string;
  mimeType: string;
  fileSize: number;
  parentAssetId?: string;
  tags?: string[];
}

export interface CreateManualTaskPayload {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number;
  dueDate?: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  taskType?: string;
  assignedToId?: number;
}
