import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let app: any;

const mocks = {
  createOrganizations: vi.fn(),
  assignAdminToOrganizations: vi.fn(),
  updateOrganizations: vi.fn(),
  getAllOrganizations: vi.fn(),
  getOrganizationById: vi.fn(),
  deleteOrganization: vi.fn(),
  unAssignFromOrganization: vi.fn(),
  changeStatus: vi.fn(),
  addToOrganization: vi.fn(),
  requestCreationForOrganizations: vi.fn(),
  handletOrgRequestDecission: vi.fn(),
  pendinOrgnizationRequest: vi.fn(),
};

vi.mock('../../controller/organization.controller.js', () => ({
  createOrganizations: mocks.createOrganizations,
  assignAdminToOrganizations: mocks.assignAdminToOrganizations,
  updateOrganizations: mocks.updateOrganizations,
  getAllOrganizations: mocks.getAllOrganizations,
  getOrganizationById: mocks.getOrganizationById,
  deleteOrganization: mocks.deleteOrganization,
  unAssignFromOrganization: mocks.unAssignFromOrganization,
  changeStatus: mocks.changeStatus,
  addToOrganization: mocks.addToOrganization,
  requestCreationForOrganizations: mocks.requestCreationForOrganizations,
  handletOrgRequestDecission: mocks.handletOrgRequestDecission,
  pendinOrgnizationRequest: mocks.pendinOrgnizationRequest,
}));

vi.mock('@dam/middlewares', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 1 };
    next();
  },
  requireSuperAdmin: (_req: any, _res: any, next: any) => next(),
  requireOrgAccess: (_req: any, _res: any, next: any) => next(),
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
  validate: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('@dam/validations', () => ({
  createOrgsSchemas: {},
  assignAdminSchema: {},
  organizationStatusSchema: {},
  addedToOrg: {},
  updateOrgsSchema: {},
}));

describe('Organization Routes', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const router = (await import('../../routes/organization.routes.js'))
      .default;

    app = express();
    app.use(express.json());
    app.use('/api/org', router);
  });

  it(' /create', async () => {
    mocks.createOrganizations.mockImplementation((req, res) =>
      res.status(201).json({ ok: true }),
    );

    const res = await request(app).post('/api/org/create').send({});

    expect(res.status).toBe(201);
    expect(mocks.createOrganizations).toHaveBeenCalled();
  });

  it(' /assign/:orgId', async () => {
    mocks.assignAdminToOrganizations.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app).post('/api/org/assign/1').send({});

    expect(res.status).toBe(200);
    expect(mocks.assignAdminToOrganizations).toHaveBeenCalled();
  });

  it(' /update/:orgId', async () => {
    mocks.updateOrganizations.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app).put('/api/org/update/1').send({});

    expect(res.status).toBe(200);
    expect(mocks.updateOrganizations).toHaveBeenCalled();
  });

  it(' /allOrg', async () => {
    mocks.getAllOrganizations.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/org/allOrg');

    expect(res.status).toBe(200);
    expect(mocks.getAllOrganizations).toHaveBeenCalled();
  });

  it(' /getOrgById/:orgId', async () => {
    mocks.getOrganizationById.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app).get('/api/org/getOrgById/1');

    expect(res.status).toBe(200);
    expect(mocks.getOrganizationById).toHaveBeenCalled();
  });

  it(' /deleteOrg/:orgId', async () => {
    mocks.deleteOrganization.mockImplementation((req, res) =>
      res.status(204).send(),
    );

    const res = await request(app).delete('/api/org/deleteOrg/1');

    expect(res.status).toBe(204);
    expect(mocks.deleteOrganization).toHaveBeenCalled();
  });

  it(' /unAssign/:orgId', async () => {
    mocks.unAssignFromOrganization.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app).patch('/api/org/unAssign/1');

    expect(res.status).toBe(200);
    expect(mocks.unAssignFromOrganization).toHaveBeenCalled();
  });

  it(' /status/:orgId', async () => {
    mocks.changeStatus.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app)
      .patch('/api/org/status/1')
      .send({ isActive: true });

    expect(res.status).toBe(200);
    expect(mocks.changeStatus).toHaveBeenCalled();
  });

  it(' /addToOrg/:orgId', async () => {
    mocks.addToOrganization.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app)
      .patch('/api/org/addToOrg/1')
      .send({ userId: 2 });

    expect(res.status).toBe(200);
    expect(mocks.addToOrganization).toHaveBeenCalled();
  });

  it(' /pendingOrgRequest', async () => {
    mocks.pendinOrgnizationRequest.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/org/pendingOrgRequest');

    expect(res.status).toBe(200);
    expect(mocks.pendinOrgnizationRequest).toHaveBeenCalled();
  });

  it(' /requestOrg', async () => {
    mocks.requestCreationForOrganizations.mockImplementation((req, res) =>
      res.status(201).json({}),
    );

    const res = await request(app).post('/api/org/requestOrg').send({});

    expect(res.status).toBe(201);
    expect(mocks.requestCreationForOrganizations).toHaveBeenCalled();
  });

  it(' /hanleOrgRequests', async () => {
    mocks.handletOrgRequestDecission.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app).post('/api/org/hanleOrgRequests').send({});

    expect(res.status).toBe(200);
    expect(mocks.handletOrgRequestDecission).toHaveBeenCalled();
  });
});
