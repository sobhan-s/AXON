import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '@dam/utils';

const repoMock = {
  findOrgsBySlugs: vi.fn(),
  createOrganizations: vi.fn(),
  findOrgById: vi.fn(),
  assignToOrgs: vi.fn(),
  findUser: vi.fn(),
  getAllOrganizations: vi.fn(),
  updateOrganizations: vi.fn(),
  deleteOrganization: vi.fn(),
  unAssignAdmin: vi.fn(),
  changeStatus: vi.fn(),
  addToOrgs: vi.fn(),
  requestCreationForOrganizations: vi.fn(),
  handleRejectOrgRequest: vi.fn(),
  handleAcceptOrgRequest: vi.fn(),
  getPendingOrgRequests: vi.fn(),
};

const authRepoMock = {
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
};

const activityMock = {
  logActivity: vi.fn(),
};

vi.mock('@dam/repository', () => {
  return {
    OrganizationRepositories: class {
      findOrgsBySlugs = repoMock.findOrgsBySlugs;
      createOrganizations = repoMock.createOrganizations;
      findOrgById = repoMock.findOrgById;
      assignToOrgs = repoMock.assignToOrgs;
      findUser = repoMock.findUser;
      getAllOrganizations = repoMock.getAllOrganizations;
      updateOrganizations = repoMock.updateOrganizations;
      deleteOrganization = repoMock.deleteOrganization;
      unAssignAdmin = repoMock.unAssignAdmin;
      changeStatus = repoMock.changeStatus;
      addToOrgs = repoMock.addToOrgs;
      requestCreationForOrganizations =
        repoMock.requestCreationForOrganizations;
      handleRejectOrgRequest = repoMock.handleRejectOrgRequest;
      handleAcceptOrgRequest = repoMock.handleAcceptOrgRequest;
      getPendingOrgRequests = repoMock.getPendingOrgRequests;
    },
  };
});

vi.mock('@dam/common', () => {
  return {
    ActivityService: class {
      logActivity = activityMock.logActivity;
    },
    AuthRepository: class {
      findUserByEmail = authRepoMock.findUserByEmail;
      findUserById = authRepoMock.findUserById;
    },
  };
});

import { OrganizationServices } from '../../services/organization.service.js';

describe('OrganizationServices', () => {
  let service: OrganizationServices;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrganizationServices();
  });

  it('should create organization', async () => {
    repoMock.findOrgsBySlugs.mockResolvedValue(null);

    repoMock.createOrganizations.mockResolvedValue({
      id: 1,
      name: 'Test',
      description: 'desc',
      storageLimit: BigInt(1000),
      storageUsed: BigInt(0),
    });

    const result = await service.createOrgs(1, '127.0.0.1', {
      name: 'Test',
      slug: 'test',
      description: 'desc',
    });

    expect(repoMock.createOrganizations).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.organization.id).toBe(1);
  });

  it('should throw error if slug exists', async () => {
    repoMock.findOrgsBySlugs.mockResolvedValue({ id: 1 });

    await expect(
      service.createOrgs(1, '127.0.0.1', {
        name: 'Test',
        slug: 'test',
      }),
    ).rejects.toThrow(ApiError);
  });

  it('should assign admin', async () => {
    repoMock.findOrgById.mockResolvedValue({
      id: 1,
      assignedTo: null,
    });

    repoMock.findUser.mockResolvedValue({
      id: 5,
      email: 'admin@test.com',
      username: 'admin',
      isEmailVerified: true,
      organizationId: null,
    });

    repoMock.assignToOrgs.mockResolvedValue({
      id: 1,
      storageLimit: BigInt(1000),
      storageUsed: BigInt(0),
    });

    const result = await service.assignAdmin(
      1,
      1,
      'admin@test.com',
      '127.0.0.1',
    );

    expect(repoMock.assignToOrgs).toHaveBeenCalled();
    expect(result.admin.id).toBe(5);
  });

  it('should get all organizations', async () => {
    repoMock.getAllOrganizations.mockResolvedValue([
      {
        id: 1,
        storageLimit: BigInt(1000),
        storageUsed: BigInt(0),
      },
    ]);

    const result = await service.getAllOrganizations(1);

    expect(result.result.length).toBe(1);
  });

  it('should get organization by id', async () => {
    repoMock.findOrgById.mockResolvedValue({
      id: 1,
      storageLimit: BigInt(1000),
      storageUsed: BigInt(0),
    });

    const result = await service.getOrganizationById(1);

    expect(result.organization.id).toBe(1);
  });

  it('should throw error if organization not found', async () => {
    repoMock.findOrgById.mockResolvedValue(null);

    await expect(service.getOrganizationById(1)).rejects.toThrow(ApiError);
  });

  it('should update organization', async () => {
    repoMock.findOrgById.mockResolvedValue({ id: 1 });

    repoMock.updateOrganizations.mockResolvedValue({
      id: 1,
      storageLimit: BigInt(1000),
      storageUsed: BigInt(0),
    });

    const result = await service.updateOrganization(
      1,
      { name: 'Updated' },
      1,
      '127.0.0.1',
      'agent',
    );

    expect(repoMock.updateOrganizations).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.organization.id).toBe(1);
  });

  it('should delete organization', async () => {
    repoMock.findOrgById.mockResolvedValue({
      id: 1,
      assignedTo: null,
      name: 'Test',
      storageLimit: BigInt(1000),
      storageUsed: BigInt(0),
    });

    repoMock.deleteOrganization.mockResolvedValue({});

    const result = await service.deleteOrganization(
      1,
      1,
      '127.0.0.1',
      'agent',
    );

    expect(repoMock.deleteOrganization).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.message).toBe('Organization deleted successfully');
  });

  it('should unassign admin', async () => {
    repoMock.findOrgById.mockResolvedValue({
      id: 1,
      assignedTo: 5,
      storageLimit: BigInt(1000),
      storageUsed: BigInt(0),
    });

    repoMock.unAssignAdmin.mockResolvedValue({
      id: 1,
      assignedTo: null,
      storageLimit: BigInt(1000),
      storageUsed: BigInt(0),
    });

    const result = await service.unAssignFromOrganization(1, 1);

    expect(repoMock.unAssignAdmin).toHaveBeenCalled();
    expect(result.organisations.id).toBe(1);
  });

  it('should change organization status', async () => {
    repoMock.findOrgById.mockResolvedValue({
      id: 1,
      name: 'Test',
      status: 'ACTIVE',
      creator: { id: 1 },
    });

    repoMock.changeStatus.mockResolvedValue({
      id: 1,
      status: 'INACTIVE',
      storageLimit: BigInt(1000),
      storageUsed: BigInt(0),
    });

    const result = await service.changeStautus(
      1,
      'INACTIVE',
      '127.0.0.1',
      'agent',
    );

    expect(repoMock.changeStatus).toHaveBeenCalled();
    expect(result.organization.status).toBe('INACTIVE');
  });

  it('should fetch pending org requests', async () => {
    repoMock.getPendingOrgRequests.mockResolvedValue([{ id: 1 }]);

    const result = await service.getPendingOrgRequests();

    expect(result.length).toBe(1);
  });
});