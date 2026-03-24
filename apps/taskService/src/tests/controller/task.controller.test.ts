import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockResponse } from '../helper/mockResponse.js';

let controller: any;

const mocks = {
  createManualTask: vi.fn(),
  getProjectTasks: vi.fn(),
  getTaskById: vi.fn(),
  getMyTasks: vi.fn(),
  getOverdueTasks: vi.fn(),
  getMyOverdueTasks: vi.fn(),
  updateTask: vi.fn(),
  changeStatus: vi.fn(),
  assignTask: vi.fn(),
  deleteTask: vi.fn(),
  bulkAssign: vi.fn(),
  bulkChangeStatus: vi.fn(),
  deleteBulkTasks: vi.fn(),
  getApprovals: vi.fn(),
  getPendingApprovals: vi.fn(),
  getTimeLogs: vi.fn(),
  deleteTimeLog: vi.fn(),
};

vi.mock('../../services/task.service.js', () => {
  return {
    TaskService: class {
      createManualTask = mocks.createManualTask;
      getProjectTasks = mocks.getProjectTasks;
      getTaskById = mocks.getTaskById;
      getMyTasks = mocks.getMyTasks;
      getOverdueTasks = mocks.getOverdueTasks;
      getMyOverdueTasks = mocks.getMyOverdueTasks;
      updateTask = mocks.updateTask;
      changeStatus = mocks.changeStatus;
      assignTask = mocks.assignTask;
      deleteTask = mocks.deleteTask;
      bulkAssign = mocks.bulkAssign;
      bulkChangeStatus = mocks.bulkChangeStatus;
      deleteBulkTasks = mocks.deleteBulkTasks;
      getApprovals = mocks.getApprovals;
      getPendingApprovals = mocks.getPendingApprovals;
      getTimeLogs = mocks.getTimeLogs;
      deleteTimeLog = mocks.deleteTimeLog;
    },
  };
});

describe('Task Controller', () => {
  let req: any;
  let res: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    controller = await import('../../controller/task.controller.js');

    req = {
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      user: { id: 1 },
      get: vi.fn().mockReturnValue('test-agent'),
      header: vi.fn().mockReturnValue('test-agent'),
    };

    res = mockResponse();
  });

  it('should create manual task', async () => {
    req.params = { projectId: 1 };
    req.body = { title: 'task' };

    mocks.createManualTask.mockResolvedValue({ id: 1 });

    await controller.createManualTask(req, res, vi.fn());

    expect(mocks.createManualTask).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should fetch project tasks', async () => {
    req.params = { projectId: 1 };

    mocks.getProjectTasks.mockResolvedValue([{ id: 1 }]);

    await controller.getProjectTasks(req, res, vi.fn());

    expect(mocks.getProjectTasks).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should get task by id', async () => {
    req.params = { taskId: 1 };

    mocks.getTaskById.mockResolvedValue({ id: 1 });

    await controller.getTaskById(req, res, vi.fn());

    expect(mocks.getTaskById).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should fetch my tasks', async () => {
    mocks.getMyTasks.mockResolvedValue([{ id: 1 }]);

    await controller.getMyTasks(req, res, vi.fn());

    expect(mocks.getMyTasks).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should fetch overdue tasks', async () => {
    req.params = { projectId: 1 };

    mocks.getOverdueTasks.mockResolvedValue([{ id: 1 }]);

    await controller.getOverdueTasks(req, res, vi.fn());

    expect(mocks.getOverdueTasks).toHaveBeenCalledWith(1);
  });

  it('should fetch my overdue tasks', async () => {
    mocks.getMyOverdueTasks.mockResolvedValue([{ id: 1 }]);

    await controller.getMyOverdueTasks(req, res, vi.fn());

    expect(mocks.getMyOverdueTasks).toHaveBeenCalledWith(1);
  });

  it('should update task', async () => {
    req.params = { taskId: 1 };
    req.body = { title: 'updated' };

    mocks.updateTask.mockResolvedValue({ id: 1 });

    await controller.updateTask(req, res, vi.fn());

    expect(mocks.updateTask).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should change task status', async () => {
    req.params = { taskId: 1 };
    req.body = { status: 'DONE' };

    mocks.changeStatus.mockResolvedValue({ id: 1 });

    await controller.changeStatus(req, res, vi.fn());

    expect(mocks.changeStatus).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should assign task', async () => {
    req.params = { taskId: 1 };
    req.body = { assignedToId: 2 };

    mocks.assignTask.mockResolvedValue({ id: 1 });

    await controller.assignTask(req, res, vi.fn());

    expect(mocks.assignTask).toHaveBeenCalled();
  });

  it('should delete task', async () => {
    req.params = { taskId: 1 };

    mocks.deleteTask.mockResolvedValue(undefined);

    await controller.deleteTask(req, res, vi.fn());

    expect(mocks.deleteTask).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should bulk assign tasks', async () => {
    req.body = { taskIds: [1, 2], assignedToId: 3 };

    mocks.bulkAssign.mockResolvedValue({});

    await controller.bulkAssign(req, res, vi.fn());

    expect(mocks.bulkAssign).toHaveBeenCalled();
  });

  it('should bulk change status', async () => {
    req.body = { taskIds: [1, 2], status: 'DONE' };

    mocks.bulkChangeStatus.mockResolvedValue({});

    await controller.bulkChangeStatus(req, res, vi.fn());

    expect(mocks.bulkChangeStatus).toHaveBeenCalled();
  });

  it('should bulk delete tasks', async () => {
    req.body = { taskIds: [1, 2] };

    mocks.deleteBulkTasks.mockResolvedValue({});

    await controller.bulkDelete(req, res, vi.fn());

    expect(mocks.deleteBulkTasks).toHaveBeenCalled();
  });

  it('should fetch approvals', async () => {
    req.params = { taskId: 1 };

    mocks.getApprovals.mockResolvedValue([]);

    await controller.getApprovals(req, res, vi.fn());

    expect(mocks.getApprovals).toHaveBeenCalled();
  });

  it('should fetch pending approvals', async () => {
    req.params = { projectId: 1 };

    mocks.getPendingApprovals.mockResolvedValue([]);

    await controller.getPendingApprovals(req, res, vi.fn());

    expect(mocks.getPendingApprovals).toHaveBeenCalled();
  });

  it('should fetch time logs', async () => {
    req.params = { taskId: 1 };

    mocks.getTimeLogs.mockResolvedValue([]);

    await controller.getTimeLogs(req, res, vi.fn());

    expect(mocks.getTimeLogs).toHaveBeenCalled();
  });

  it('should delete time log', async () => {
    req.params = { taskId: 1, timeLogId: 5 };

    mocks.deleteTimeLog.mockResolvedValue(undefined);

    await controller.deleteTimeLog(req, res, vi.fn());

    expect(mocks.deleteTimeLog).toHaveBeenCalled();
  });
});