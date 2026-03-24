import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '@dam/utils';

const taskRepoMock = {
  createManualTask: vi.fn(),
  createAssetBasedTask: vi.fn(),
  findTaskById: vi.fn(),
  findProjectById: vi.fn(),
  findTasksByProject: vi.fn(),
  getMyTasks: vi.fn(),
  getProjectOverdueTasks: vi.fn(),
  getMyOverdueTasks: vi.fn(),
  getMemberRole: vi.fn(),
  assignTask: vi.fn(),
  updateTaskStatus: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  deleteBulkTask: vi.fn(),
  bulkAssignTask: vi.fn(),
  bulkStaus: vi.fn(),
};

const approvalRepoMock = {
  createApproval: vi.fn(),
  getPendingApprovalByTaskId: vi.fn(),
  reviewApproval: vi.fn(),
  findApprovalsByTask: vi.fn(),
  getPendingApprovals: vi.fn(),
};

const timelogRepoMock = {
  openSession: vi.fn(),
  closeSession: vi.fn(),
  findTimeLogsByUser: vi.fn(),
  getTotalHoursByUser: vi.fn(),
  findTimeLogsByTask: vi.fn(),
  getTotalHours: vi.fn(),
  findTimeLogById: vi.fn(),
  deleteTimeLog: vi.fn(),
};

const assetRepoMock = {
  getById: vi.fn(),
  updateAsset: vi.fn(),
};

const activityMock = {
  logActivity: vi.fn(),
};

vi.mock('@dam/repository', () => {
  return {
    TaskRepository: class {
      createManualTask = taskRepoMock.createManualTask;
      createAssetBasedTask = taskRepoMock.createAssetBasedTask;
      findTaskById = taskRepoMock.findTaskById;
      findProjectById = taskRepoMock.findProjectById;
      findTasksByProject = taskRepoMock.findTasksByProject;
      getMyTasks = taskRepoMock.getMyTasks;
      getProjectOverdueTasks = taskRepoMock.getProjectOverdueTasks;
      getMyOverdueTasks = taskRepoMock.getMyOverdueTasks;
      getMemberRole = taskRepoMock.getMemberRole;
      assignTask = taskRepoMock.assignTask;
      updateTaskStatus = taskRepoMock.updateTaskStatus;
      updateTask = taskRepoMock.updateTask;
      deleteTask = taskRepoMock.deleteTask;
      deleteBulkTask = taskRepoMock.deleteBulkTask;
      bulkAssignTask = taskRepoMock.bulkAssignTask;
      bulkStaus = taskRepoMock.bulkStaus;
    },
    ApprovalRepository: class {
      createApproval = approvalRepoMock.createApproval;
      getPendingApprovalByTaskId =
        approvalRepoMock.getPendingApprovalByTaskId;
      reviewApproval = approvalRepoMock.reviewApproval;
      findApprovalsByTask = approvalRepoMock.findApprovalsByTask;
      getPendingApprovals = approvalRepoMock.getPendingApprovals;
    },
    TimelogRepository: class {
      openSession = timelogRepoMock.openSession;
      closeSession = timelogRepoMock.closeSession;
      findTimeLogsByUser = timelogRepoMock.findTimeLogsByUser;
      getTotalHoursByUser = timelogRepoMock.getTotalHoursByUser;
      findTimeLogsByTask = timelogRepoMock.findTimeLogsByTask;
      getTotalHours = timelogRepoMock.getTotalHours;
      findTimeLogById = timelogRepoMock.findTimeLogById;
      deleteTimeLog = timelogRepoMock.deleteTimeLog;
    },
    AssetRepository: class {
      getById = assetRepoMock.getById;
      updateAsset = assetRepoMock.updateAsset;
    },
  };
});

vi.mock('@dam/common', () => {
  return {
    ActivityService: class {
      logActivity = activityMock.logActivity;
    },
    AuthRepository: class {},
  };
});

import { TaskService } from '../../services/task.service.js';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaskService();
  });

  it('should create manual task', async () => {
    taskRepoMock.createManualTask.mockResolvedValue({
      id: 1,
      title: 'task',
      project: { organizationId: 1 },
    });

    const result = await service.createManualTask(1, 1, { title: 'task' });

    expect(taskRepoMock.createManualTask).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.id).toBe(1);
  });

  it('should throw error if task not found', async () => {
    taskRepoMock.findTaskById.mockResolvedValue(null);

    await expect(service.getTaskById(1)).rejects.toThrow(ApiError);
  });

  it('should fetch project tasks', async () => {
    taskRepoMock.findTasksByProject.mockResolvedValue([{ id: 1 }]);

    const result = await service.getProjectTasks(1);

    expect(taskRepoMock.findTasksByProject).toHaveBeenCalled();
    expect(result.length).toBe(1);
  });

  it('should fetch my tasks', async () => {
    taskRepoMock.getMyTasks.mockResolvedValue([{ id: 2 }]);

    const result = await service.getMyTasks(1);

    expect(result.length).toBe(1);
  });

  it('should update task', async () => {
    taskRepoMock.findTaskById.mockResolvedValue({
      id: 1,
      project: { id: 1, organizationId: 1 },
    });

    taskRepoMock.getMemberRole.mockResolvedValue({
      role: { level: 1 },
    });

    taskRepoMock.updateTask.mockResolvedValue({
      id: 1,
      title: 'updated',
    });

    const result = await service.updateTask(1, 1, { title: 'updated' });

    expect(taskRepoMock.updateTask).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.title).toBe('updated');
  });

  it('should delete task', async () => {
    taskRepoMock.findTaskById.mockResolvedValue({
      id: 1,
      title: 'task',
      project: { id: 1, organizationId: 1 },
    });

    taskRepoMock.getMemberRole.mockResolvedValue({
      role: { level: 1 },
    });

    taskRepoMock.deleteTask.mockResolvedValue(true);

    const result = await service.deleteTask(1, 1);

    expect(taskRepoMock.deleteTask).toHaveBeenCalled();
    expect(result.message).toContain('Tasks');
  });

  it('should assign task', async () => {
    taskRepoMock.findTaskById.mockResolvedValue({
      id: 1,
      status: 'TODO',
      taskType: 'MANUAL',
      assignedToId: null,
      createdById: 1,
      project: { id: 1, organizationId: 1 },
    });

    taskRepoMock.getMemberRole
      .mockResolvedValueOnce({ role: { level: 1 } }) // requester
      .mockResolvedValueOnce({ role: { level: 5 } }); // assignee

    taskRepoMock.assignTask.mockResolvedValue({
      id: 1,
      assignedToId: 2,
    });

    const result = await service.assignTask(1, 1, 2);

    expect(taskRepoMock.assignTask).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.assignedToId).toBe(2);
  });

  it('should fetch approvals', async () => {
    taskRepoMock.findTaskById.mockResolvedValue({ id: 1 });

    approvalRepoMock.findApprovalsByTask.mockResolvedValue([{ id: 1 }]);

    const result = await service.getApprovals(1, 1);

    expect(result.length).toBe(1);
  });

  it('should fetch pending approvals', async () => {
    taskRepoMock.findProjectById.mockResolvedValue({ id: 1 });

    approvalRepoMock.getPendingApprovals.mockResolvedValue([{ id: 1 }]);

    const result = await service.getPendingApprovals(1);

    expect(result.length).toBe(1);
  });

  it('should fetch time logs for member', async () => {
    taskRepoMock.findTaskById.mockResolvedValue({
      id: 1,
      project: { id: 1 },
    });

    taskRepoMock.getMemberRole.mockResolvedValue({
      role: { level: 5 },
    });

    timelogRepoMock.findTimeLogsByUser.mockResolvedValue([{ id: 1 }]);
    timelogRepoMock.getTotalHoursByUser.mockResolvedValue(5);

    const result = await service.getTimeLogs(1, 1);

    expect(result.totalHours).toBe(5);
  });

  it('should delete timelog', async () => {
    taskRepoMock.findTaskById.mockResolvedValue({
      id: 1,
      project: { id: 1 },
    });

    taskRepoMock.getMemberRole.mockResolvedValue({
      role: { level: 1 },
    });

    timelogRepoMock.findTimeLogById.mockResolvedValue({
      id: 1,
      taskId: 1,
    });

    await service.deleteTimeLog(1, 1, 1);

    expect(timelogRepoMock.deleteTimeLog).toHaveBeenCalled();
  });
});