export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'FAILED' | 'DONE';
  taskType: 'MANUAL' | 'ASSET_BASED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;
  dueDate: string | null;
  assignedTo: { id: number; username: string; avatarUrl: string | null } | null;
  projectId: number;
  createdBy?: { id: number; username: string; avatarUrl: string | null } | null;
  _count: { timeLogs: number; approvals: number };
}

export interface Filters {
  status: string;
  priority: string;
  taskType: string;
  assignedToId: string;
}

export const EMPTY_FILTERS: Filters = {
  status: '',
  priority: '',
  taskType: '',
  assignedToId: '',
};

export function activeFilterCount(f: Filters) {
  return Object.values(f).filter(Boolean).length;
}