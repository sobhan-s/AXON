import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let app: any;

const mocks = {
  addUsersToOrganizations: vi.fn(),
  changePasswordHandler: vi.fn(),
  deleteMe: vi.fn(),
  getOrganizationMembers: vi.fn(),
  getUserMe: vi.fn(),
  removeUsersToOrganizations: vi.fn(),
  updateUserMe: vi.fn(),
  getParticularUser: vi.fn(),
  updateUserDetailInOrg: vi.fn(),
};

vi.mock('../../controller/user.controller.js', () => ({
  addUsersToOrganizations: mocks.addUsersToOrganizations,
  changePasswordHandler: mocks.changePasswordHandler,
  deleteMe: mocks.deleteMe,
  getOrganizationMembers: mocks.getOrganizationMembers,
  getUserMe: mocks.getUserMe,
  removeUsersToOrganizations: mocks.removeUsersToOrganizations,
  updateUserMe: mocks.updateUserMe,
  getParticularUser: mocks.getParticularUser,
  updateUserDetailInOrg: mocks.updateUserDetailInOrg,
}));

vi.mock('@dam/middlewares', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 1 };
    next();
  },
  requireOrgAccess: (_req: any, _res: any, next: any) => next(),
  requirePermission: () => (_req: any, _res: any, next: any) => next(),
  validate: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('@dam/validations', () => ({
  addUserToOrg: {},
  updateUserAdminLevelSchema: {},
}));

describe('User Routes', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const router = (await import('../../routes/user.routes.js')).default;

    app = express();
    app.use(express.json());
    app.use('/api/users', router);
  });

  it('/getme', async () => {
    mocks.getUserMe.mockImplementation((req, res) =>
      res.status(200).json({ id: 1 }),
    );

    const res = await request(app).get('/api/users/getme');

    expect(res.status).toBe(200);
    expect(mocks.getUserMe).toHaveBeenCalled();
  });

  it('/updateme', async () => {
    mocks.updateUserMe.mockImplementation((req, res) =>
      res.status(200).json({ updated: true }),
    );

    const res = await request(app)
      .patch('/api/users/updateme')
      .send({ name: 'test' });

    expect(res.status).toBe(200);
    expect(mocks.updateUserMe).toHaveBeenCalled();
  });

  it('/deleteme', async () => {
    mocks.deleteMe.mockImplementation((req, res) => res.status(204).send());

    const res = await request(app).delete('/api/users/deleteme');

    expect(res.status).toBe(204);
    expect(mocks.deleteMe).toHaveBeenCalled();
  });

  it('/changePassword', async () => {
    mocks.changePasswordHandler.mockImplementation((req, res) =>
      res.status(200).json({ changed: true }),
    );

    const res = await request(app)
      .patch('/api/users/changePassword')
      .send({ old: '123', new: '456' });

    expect(res.status).toBe(200);
    expect(mocks.changePasswordHandler).toHaveBeenCalled();
  });

  it('/getOrgUsers/:orgId', async () => {
    mocks.getOrganizationMembers.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/users/getOrgUsers/1');

    expect(res.status).toBe(200);
    expect(mocks.getOrganizationMembers).toHaveBeenCalled();
  });

  it('/puser/:orgId/:userId', async () => {
    mocks.getParticularUser.mockImplementation((req, res) =>
      res.status(200).json({}),
    );

    const res = await request(app).get('/api/users/puser/1/2');

    expect(res.status).toBe(200);
    expect(mocks.getParticularUser).toHaveBeenCalled();
  });

  it('/createUser/:orgId', async () => {
    mocks.addUsersToOrganizations.mockImplementation((req, res) =>
      res.status(201).json({ created: true }),
    );

    const res = await request(app)
      .post('/api/users/createUser/1')
      .send({ email: 'test@mail.com' });

    expect(res.status).toBe(201);
    expect(mocks.addUsersToOrganizations).toHaveBeenCalled();
  });

  it('/removeUser/:orgId', async () => {
    mocks.removeUsersToOrganizations.mockImplementation((req, res) =>
      res.status(200).json({ removed: true }),
    );

    const res = await request(app)
      .delete('/api/users/removeUser/1')
      .send({ userId: 2 });

    expect(res.status).toBe(200);
    expect(mocks.removeUsersToOrganizations).toHaveBeenCalled();
  });

  it('/update/:orgId', async () => {
    mocks.updateUserDetailInOrg.mockImplementation((req, res) =>
      res.status(200).json({ updated: true }),
    );

    const res = await request(app)
      .put('/api/users/update/1')
      .send({ userId: 2, role: 'admin' });

    expect(res.status).toBe(200);
    expect(mocks.updateUserDetailInOrg).toHaveBeenCalled();
  });
});
