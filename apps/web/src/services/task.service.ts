import axios from 'axios';
import { TASK_ENDPOINTS } from '@/lib/api-endpints';

export type TaskStatus =
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'APPROVED'
  | 'FAILED'
  | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'FAILED' | 'DONE';
  taskType: 'MANUAL' | 'ASSET_BASED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;
  dueDate: string | null;
  assignedTo: {
    id: number;
    username: string;
    avatarUrl: string | null;
  } | null;
  projectId: number;
  createdBy?: {
    id: number;
    username: string;
    avatarUrl: string | null;
  } | null;
  _count: {
    timeLogs: number;
    approvals: number;
  };
}

export interface PendingApprovals {
  id: number;
  taskId: number;
  assetId: string;
  projectId: number;
  requestedById: number;
  reviewedById: number | null;
  status: TaskStatus;
  comments?: string;
  requestedAt: string;
  reviewedAt: string;
  requestedBy: {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  reviewedBy: {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  task: {
    title: string;
    description: string | null;
  };
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  estimatedHours?: number;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  estimatedHours?: number;
  dueDate?: string;
}

export interface AssignTaskPayload {
  assignedToId: number;
}

export interface BulkAssignPayload {
  taskIds: number[];
  assignedToId: number;
}

export interface BulkStatusPayload {
  taskIds: number[];
  status: TaskStatus;
}

export interface BulkDeletePayload {
  taskIds: number[];
}

const api = axios.create({
  withCredentials: true,
});

export const taskService = {
  async getMyTasks(projectId: number): Promise<Task[]> {
    const { data } = await api.get(TASK_ENDPOINTS.GET_MY_TASKS(projectId));
    return data?.data?.tasks ?? [];
  },

  async getMyOverdueTasks(projectId: number): Promise<Task[]> {
    const { data } = await api.get(TASK_ENDPOINTS.GET_MY_OVERDUE(projectId));
    return data?.data?.tasks ?? [];
  },

  async getProjectTasks(
    projectId: number,
    params?: Record<string, any>,
  ): Promise<Task[]> {
    const { data } = await api.get(
      TASK_ENDPOINTS.GET_PROJECT_TASKS(projectId),
      { params },
    );
    return data?.data ?? [];
  },

  async getOverdueTasks(projectId: number): Promise<Task[]> {
    const { data } = await api.get(TASK_ENDPOINTS.GET_OVERDUE(projectId));
    return data?.data?.tasks ?? [];
  },

  async createTask(
    projectId: number,
    payload: CreateTaskPayload,
  ): Promise<Task> {
    const { data } = await api.post(
      TASK_ENDPOINTS.CREATE_TASK(projectId),
      payload,
    );
    return data?.data ?? data;
  },

  async getById(projectId: number, taskId: number): Promise<Task> {
    const { data } = await api.get(TASK_ENDPOINTS.GET_TASK(projectId, taskId));
    return data?.data ?? data;
  },

  async updateTask(
    projectId: number,
    taskId: number,
    payload: UpdateTaskPayload,
  ): Promise<Task> {
    const { data } = await api.put(
      TASK_ENDPOINTS.UPDATE_TASK(projectId, taskId),
      payload,
    );
    return data?.data ?? data;
  },

  async deleteTask(taskId: number): Promise<void> {
    await api.delete(TASK_ENDPOINTS.DELETE_TASK(taskId));
  },

  async changeStatus(
    projectId: number,
    taskId: number,
    status: TaskStatus,
    comments?: string,
  ): Promise<Task> {
    const { data } = await api.patch(
      TASK_ENDPOINTS.CHANGE_STATUS(projectId, taskId),
      { status, comments: comments },
    );
    return data?.data ?? data;
  },

  async assignTask(
    projectId: number,
    taskId: number,
    payload: AssignTaskPayload,
  ): Promise<Task> {
    const { data } = await api.patch(
      TASK_ENDPOINTS.ASSIGN_TASK(projectId, taskId),
      payload,
    );
    return data?.data ?? data;
  },

  async bulkAssign(
    projectId: number,
    payload: BulkAssignPayload,
  ): Promise<void> {
    await api.patch(TASK_ENDPOINTS.BULK_ASSIGN(projectId), payload);
  },

  async bulkChangeStatus(payload: BulkStatusPayload): Promise<void> {
    await api.patch(TASK_ENDPOINTS.BULK_STATUS, payload);
  },

  async bulkDelete(
    projectId: number,
    payload: BulkDeletePayload,
  ): Promise<void> {
    await api.delete(TASK_ENDPOINTS.BULK_DELETE(projectId), { data: payload });
  },

  async getApprovals(taskId: number) {
    const { data } = await api.get(TASK_ENDPOINTS.GET_APPROVALS(taskId));
    return data?.data ?? [];
  },

  async getPendingApprovals(projectId: number): Promise<PendingApprovals[]> {
    const { data } = await api.get(
      TASK_ENDPOINTS.GET_PENDING_APPROVALS(projectId),
    );
    return data?.data ?? [];
  },

  async getTimeLogs(taskId: number) {
    const { data } = await api.get(TASK_ENDPOINTS.GET_TIMELOGS(taskId));
    return data?.data?.timeLogs ?? [];
  },

  async deleteTimeLog(taskId: number, timeLogId: number): Promise<void> {
    await api.delete(TASK_ENDPOINTS.DELETE_TIMELOG(taskId, timeLogId));
  },
};
