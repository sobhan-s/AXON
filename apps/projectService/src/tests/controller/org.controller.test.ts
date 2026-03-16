import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockResponse } from '../helper/mockResponse.js';

let controller: any;

const mocks = {
  createOrgs: vi.fn(),
  assignAdmin: vi.fn(),
  updateOrganization: vi.fn(),
  getAllOrganizations: vi.fn(),
  getOrganizationById: vi.fn(),
  deleteOrganization: vi.fn(),
  unAssignFromOrganization: vi.fn(),
  changeStautus: vi.fn(),
  addToTheOrganizations: vi.fn(),
  requestCreationForOrganizations: vi.fn(),
  handletOrgRequestDecission: vi.fn(),
  getPendingOrgRequests: vi.fn(),
};

vi.mock('../../services/organization.service.js', () => {
  return {
    OrganizationServices: class {
      createOrgs = mocks.createOrgs;
      assignAdmin = mocks.assignAdmin;
      updateOrganization = mocks.updateOrganization;
      getAllOrganizations = mocks.getAllOrganizations;
      getOrganizationById = mocks.getOrganizationById;
      deleteOrganization = mocks.deleteOrganization;
      unAssignFromOrganization = mocks.unAssignFromOrganization;
      changeStautus = mocks.changeStautus;
      addToTheOrganizations = mocks.addToTheOrganizations;
      requestCreationForOrganizations =
        mocks.requestCreationForOrganizations;
      handletOrgRequestDecission =
        mocks.handletOrgRequestDecission;
      getPendingOrgRequests = mocks.getPendingOrgRequests;
    },
  };
});

describe('Organization Controller', () => {
  let req: any;
  let res: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    controller = await import('../../controller/organization.controller.js');

    req = {
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('test-agent'),
      user: { id: 1 },
    };

    res = mockResponse();
  });

  it('should create organization', async () => {
    req.body = {
      name: 'Test Org',
      slug: 'test-org',
      description: 'desc',
    };

    mocks.createOrgs.mockResolvedValue({
      organization: { id: 1 },
    });

    await controller.createOrganizations(req, res, vi.fn());

    expect(mocks.createOrgs).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should assign admin to organization', async () => {
    req.params = { orgId: '1' };
    req.body = { adminEmail: 'admin@test.com' };

    mocks.assignAdmin.mockResolvedValue({
      organization: { assignedTo: 'admin@test.com' },
    });

    await controller.assignAdminToOrganizations(req, res, vi.fn());

    expect(mocks.assignAdmin).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should update organization', async () => {
    req.params = { orgId: '1' };
    req.body = { name: 'Updated Org' };

    mocks.updateOrganization.mockResolvedValue({
      organization: { id: 1 },
    });

    await controller.updateOrganizations(req, res, vi.fn());

    expect(mocks.updateOrganization).toHaveBeenCalled();
  });

  it('should get all organizations', async () => {
    mocks.getAllOrganizations.mockResolvedValue([{ id: 1 }]);

    await controller.getAllOrganizations(req, res, vi.fn());

    expect(mocks.getAllOrganizations).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should get organization by id', async () => {
    req.params = { orgId: '5' };

    mocks.getOrganizationById.mockResolvedValue({ id: 5 });

    await controller.getOrganizationById(req, res, vi.fn());

    expect(mocks.getOrganizationById).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should delete organization', async () => {
    req.params = { orgId: '5' };

    mocks.deleteOrganization.mockResolvedValue(undefined);

    await controller.deleteOrganization(req, res, vi.fn());

    expect(mocks.deleteOrganization).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('should unassign admin from organization', async () => {
    req.params = { orgId: '1' };

    mocks.unAssignFromOrganization.mockResolvedValue({});

    await controller.unAssignFromOrganization(req, res, vi.fn());

    expect(mocks.unAssignFromOrganization).toHaveBeenCalledWith(1, 1);
  });

  it('should change organization status', async () => {
    req.params = { orgId: '1' };
    req.body = { isActive: false };

    mocks.changeStautus.mockResolvedValue({});

    await controller.changeStatus(req, res, vi.fn());

    expect(mocks.changeStautus).toHaveBeenCalled();
  });

  it('should request organization creation', async () => {
    req.body = {
      requetedUserMail: 'user@test.com',
      orgName: 'TestOrg',
      orgSlug: 'test-org',
    };

    mocks.requestCreationForOrganizations.mockResolvedValue({});

    await controller.requestCreationForOrganizations(req, res, vi.fn());

    expect(mocks.requestCreationForOrganizations).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should handle organization request decision', async () => {
    req.body = {
      orgName: 'TestOrg',
      orgSlug: 'test-org',
      requestedByUserEmail: 'user@test.com',
      status: 'approved',
    };

    mocks.handletOrgRequestDecission.mockResolvedValue({});

    await controller.handletOrgRequestDecission(req, res, vi.fn());

    expect(mocks.handletOrgRequestDecission).toHaveBeenCalled();
  });

  it('should fetch pending organization requests', async () => {
    mocks.getPendingOrgRequests.mockResolvedValue([]);

    await controller.pendinOrgnizationRequest(req, res, vi.fn());

    expect(mocks.getPendingOrgRequests).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});