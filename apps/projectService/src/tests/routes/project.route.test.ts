import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let app: any;

const mocks = {
  addManager: vi.fn(),
  addTeamMember: vi.fn(),
  archiveProject: vi.fn(),
  createProject: vi.fn(),
  deleteProject: vi.fn(),
  getAllProjects: vi.fn(),
  getMyProjects: vi.fn(),
  getProjectById: vi.fn(),
  getTeamMembers: vi.fn(),
  removeTeamMember: vi.fn(),
  updateProject: vi.fn(),
};

vi.mock('../../controller/project.controller.js', () => ({
  addManager: mocks.addManager,
  addTeamMember: mocks.addTeamMember,
  archiveProject: mocks.archiveProject,
  createProject: mocks.createProject,
  deleteProject: mocks.deleteProject,
  getAllProjects: mocks.getAllProjects,
  getMyProjects: mocks.getMyProjects,
  getProjectById: mocks.getProjectById,
  getTeamMembers: mocks.getTeamMembers,
  removeTeamMember: mocks.removeTeamMember,
  updateProject: mocks.updateProject,
}));

vi.mock('@dam/middlewares', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 1 };
    next();
  },
  requireOrgAccess: (_req: any, _res: any, next: any) => next(),
  requireProjectAccess: (_req: any, _res: any, next: any) => next(),
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
  validate: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('@dam/validations', () => ({
  createProjectsSchemas: {},
  updateProjectSchema: {},
}));

describe('Project Routes', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const router = (await import('../../routes/project.routes.js')).default;

    app = express();
    app.use(express.json());
    app.use('/api/projects', router);
  });

  it(' /:orgId/create', async () => {
    mocks.createProject.mockImplementation((req, res) =>
      res.status(201).json({}),
    );

    const res = await request(app).post('/api/projects/1/create').send({});

    expect(res.status).toBe(201);
    expect(mocks.createProject).toHaveBeenCalled();
  });

  it(' /:orgId/all', async () => {
    mocks.getAllProjects.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/projects/1/all');

    expect(res.status).toBe(200);
    expect(mocks.getAllProjects).toHaveBeenCalled();
  });

  it(' /my-projects', async () => {
    mocks.getMyProjects.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/projects/my-projects');

    expect(res.status).toBe(200);
    expect(mocks.getMyProjects).toHaveBeenCalled();
  });

  it(' /assignManager/:orgId/:projectId', async () => {
    mocks.addManager.mockImplementation((req, res) => res.status(200).json({}));

    const res = await request(app).patch('/api/projects/assignManager/1/2');

    expect(res.status).toBe(200);
    expect(mocks.addManager).toHaveBeenCalled();
  });

  it(' /:projectId', async () => {
    mocks.updateProject.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app).put('/api/projects/10').send({});

    expect(res.status).toBe(200);
    expect(mocks.updateProject).toHaveBeenCalled();
  });

  it(' /addTeamMembers/:orgId/:projectId', async () => {
    mocks.addTeamMember.mockImplementation((req, res) =>
      res.status(201).json({}),
    );

    const res = await request(app)
      .post('/api/projects/addTeamMembers/1/2')
      .send({});

    expect(res.status).toBe(201);
    expect(mocks.addTeamMember).toHaveBeenCalled();
  });

  it(' /removeTeamMember/:orgId/:projectId', async () => {
    mocks.removeTeamMember.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app)
      .delete('/api/projects/removeTeamMember/1/2')
      .send({});

    expect(res.status).toBe(200);
    expect(mocks.removeTeamMember).toHaveBeenCalled();
  });

  it(' /getProject/:orgId/:projectId', async () => {
    mocks.getProjectById.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app).get('/api/projects/getProject/1/2');

    expect(res.status).toBe(200);
    expect(mocks.getProjectById).toHaveBeenCalled();
  });

  it(' /archiveProject/:orgId/:projectId', async () => {
    mocks.archiveProject.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app).patch('/api/projects/archiveProject/1/2');

    expect(res.status).toBe(200);
    expect(mocks.archiveProject).toHaveBeenCalled();
  });

  it(' /deleteProject/:orgId/:projectId', async () => {
    mocks.deleteProject.mockImplementation((req, res) =>
      res.status(204).send(),
    );

    const res = await request(app).delete('/api/projects/deleteProject/1/2');

    expect(res.status).toBe(204);
    expect(mocks.deleteProject).toHaveBeenCalled();
  });

  it(' /getTeamMembers/:orgId/:projectId', async () => {
    mocks.getTeamMembers.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/projects/getTeamMembers/1/2');

    expect(res.status).toBe(200);
    expect(mocks.getTeamMembers).toHaveBeenCalled();
  });
});
