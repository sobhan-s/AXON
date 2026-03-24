import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let app: any;

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
  bulkDelete: vi.fn(),
  getApprovals: vi.fn(),
  getTimeLogs: vi.fn(),
  deleteTimeLog: vi.fn(),
  getPendingApprovals: vi.fn(),
};

vi.mock('../../controller/task.controller.js', () => ({
  createManualTask: mocks.createManualTask,
  getProjectTasks: mocks.getProjectTasks,
  getTaskById: mocks.getTaskById,
  getMyTasks: mocks.getMyTasks,
  getOverdueTasks: mocks.getOverdueTasks,
  getMyOverdueTasks: mocks.getMyOverdueTasks,
  updateTask: mocks.updateTask,
  changeStatus: mocks.changeStatus,
  assignTask: mocks.assignTask,
  deleteTask: mocks.deleteTask,
  bulkAssign: mocks.bulkAssign,
  bulkChangeStatus: mocks.bulkChangeStatus,
  bulkDelete: mocks.bulkDelete,
  getApprovals: mocks.getApprovals,
  getTimeLogs: mocks.getTimeLogs,
  deleteTimeLog: mocks.deleteTimeLog,
  getPendingApprovals: mocks.getPendingApprovals,
}));

vi.mock('@dam/middlewares', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 1 };
    next();
  },
  requireProjectAccess: (_req: any, _res: any, next: any) => next(),
  requireOrgAccess: (_req: any, _res: any, next: any) => next(),
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
  validate: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('@dam/validations', () => ({
  createManualTaskSchema: {},
  updateTaskSchema: {},
  changeStatusSchema: {},
  assignTaskSchema: {},
  bulkAssignSchema: {},
  bulkStatusSchema: {},
  bulkDeleteSchema: {},
}));

describe('Task Routes', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const router = (await import('../../routes/task.routes.js')).default;

    app = express();
    app.use(express.json());
    app.use('/api/tasks', router);
  });

  it('/my/:projectId', async () => {
    mocks.getMyTasks.mockImplementation((req, res) => res.status(200).json([]));

    const res = await request(app).get('/api/tasks/my/1');

    expect(res.status).toBe(200);
    expect(mocks.getMyTasks).toHaveBeenCalled();
  });

  it('/my/overdue/:projectId', async () => {
    mocks.getMyOverdueTasks.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/tasks/my/overdue/1');

    expect(res.status).toBe(200);
    expect(mocks.getMyOverdueTasks).toHaveBeenCalled();
  });

  it('/getProjectTasks/project/:projectId', async () => {
    mocks.getProjectTasks.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/tasks/getProjectTasks/project/1');

    expect(res.status).toBe(200);
    expect(mocks.getProjectTasks).toHaveBeenCalled();
  });

  it('/overdueTasks/project/:projectId', async () => {
    mocks.getOverdueTasks.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/tasks/overdueTasks/project/1');

    expect(res.status).toBe(200);
    expect(mocks.getOverdueTasks).toHaveBeenCalled();
  });

  it('/createTask/project/:projectId', async () => {
    mocks.createManualTask.mockImplementation((req, res) =>
      res.status(201).json({}),
    );

    const res = await request(app)
      .post('/api/tasks/createTask/project/1')
      .send({});

    expect(res.status).toBe(201);
    expect(mocks.createManualTask).toHaveBeenCalled();
  });

  it('/getTaskById/:projectId/:taskId', async () => {
    mocks.getTaskById.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app).get('/api/tasks/getTaskById/1/2');

    expect(res.status).toBe(200);
    expect(mocks.getTaskById).toHaveBeenCalled();
  });

  it('/updateTask/:projectId/:taskId', async () => {
    mocks.updateTask.mockImplementation((req, res) => res.status(200).json({}));

    const res = await request(app).put('/api/tasks/updateTask/1/2').send({});

    expect(res.status).toBe(200);
    expect(mocks.updateTask).toHaveBeenCalled();
  });

  it('/deleteTask/:taskId', async () => {
    mocks.deleteTask.mockImplementation((req, res) => res.status(204).send());

    const res = await request(app).delete('/api/tasks/deleteTask/2');

    expect(res.status).toBe(204);
    expect(mocks.deleteTask).toHaveBeenCalled();
  });

  it('/status/:projectId/:taskId', async () => {
    mocks.changeStatus.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app).patch('/api/tasks/status/1/2').send({});

    expect(res.status).toBe(200);
    expect(mocks.changeStatus).toHaveBeenCalled();
  });

  it('/assign/:projectId/:taskId', async () => {
    mocks.assignTask.mockImplementation((req, res) => res.status(200).json({}));

    const res = await request(app).patch('/api/tasks/assign/1/2').send({});

    expect(res.status).toBe(200);
    expect(mocks.assignTask).toHaveBeenCalled();
  });

  it('/bulk/assign/:projectId', async () => {
    mocks.bulkAssign.mockImplementation((req, res) => res.status(200).json({}));

    const res = await request(app).patch('/api/tasks/bulk/assign/1').send({});

    expect(res.status).toBe(200);
    expect(mocks.bulkAssign).toHaveBeenCalled();
  });

  it('/bulk/status', async () => {
    mocks.bulkChangeStatus.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app).patch('/api/tasks/bulk/status').send({});

    expect(res.status).toBe(200);
    expect(mocks.bulkChangeStatus).toHaveBeenCalled();
  });

  it('/bulk/delete/:projectId', async () => {
    mocks.bulkDelete.mockImplementation((req, res) => res.status(200).json({}));

    const res = await request(app).delete('/api/tasks/bulk/delete/1').send({});

    expect(res.status).toBe(200);
    expect(mocks.bulkDelete).toHaveBeenCalled();
  });

  it('/:taskId/approvals', async () => {
    mocks.getApprovals.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/tasks/2/approvals');

    expect(res.status).toBe(200);
    expect(mocks.getApprovals).toHaveBeenCalled();
  });

  it('/getPendingApprovals/:projectId', async () => {
    mocks.getPendingApprovals.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/tasks/getPendingApprovals/1');

    expect(res.status).toBe(200);
    expect(mocks.getPendingApprovals).toHaveBeenCalled();
  });

  it('/:taskId/timelogs', async () => {
    mocks.getTimeLogs.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/tasks/2/timelogs');

    expect(res.status).toBe(200);
    expect(mocks.getTimeLogs).toHaveBeenCalled();
  });

  it('/:taskId/timelogs/:timeLogId', async () => {
    mocks.deleteTimeLog.mockImplementation((req, res) =>
      res.status(204).send(),
    );

    const res = await request(app).delete('/api/tasks/2/timelogs/5');

    expect(res.status).toBe(204);
    expect(mocks.deleteTimeLog).toHaveBeenCalled();
  });
});
