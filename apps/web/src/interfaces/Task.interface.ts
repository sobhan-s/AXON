export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'FAILED' | 'DONE';
  taskType: 'MANUAL' | 'ASSET_BASED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  dueDate: string | null;
  projectId: number;
}