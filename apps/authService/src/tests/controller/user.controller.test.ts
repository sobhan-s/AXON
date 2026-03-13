import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockResponse } from '../helper/mockResponse.js';

let controller: any;

const mocks = {
  getMe: vi.fn(),
  updateMe: vi.fn(),
  deleteMe: vi.fn(),
  changePassword: vi.fn(),
  getOrgUsers: vi.fn(),
  addUserToOranization: vi.fn(),
  removeUserToOrganization: vi.fn(),
  getUserProfiles: vi.fn(),
  updateUserDetails: vi.fn(),
};

vi.mock('../../services/user.service.js', () => {
  return {
    userService: class {
      getMe = mocks.getMe;
      updateMe = mocks.updateMe;
      deleteMe = mocks.deleteMe;
      changePassword = mocks.changePassword;
      getOrgUsers = mocks.getOrgUsers;
      addUserToOranization = mocks.addUserToOranization;
      removeUserToOrganization = mocks.removeUserToOrganization;
      getUserProfiles = mocks.getUserProfiles;
      updateUserDetails = mocks.updateUserDetails;
    },
  };
});

describe('User Controller', () => {
  let req: any;
  let res: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    controller = await import('../../controller/user.controller.js');

    req = {
      body: {},
      params: {},
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('test-agent'),
      user: { id: 1 },
    };

    res = mockResponse();
  });

  it('should get current user', async () => {
    mocks.getMe.mockResolvedValue({ id: 1 });

    await controller.getUserMe(req, res, vi.fn());

    expect(mocks.getMe).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should update user profile', async () => {
    req.body = { username: 'newname' };

    mocks.updateMe.mockResolvedValue({});

    await controller.updateUserMe(req, res, vi.fn());

    expect(mocks.updateMe).toHaveBeenCalledWith(1, req.body);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('should change password', async () => {
    req.body = {
      currentPassword: 'old',
      newPassword: 'new',
    };

    mocks.changePassword.mockResolvedValue(undefined);

    await controller.changePasswordHandler(req, res, vi.fn());

    expect(mocks.changePassword).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('should fetch organization users', async () => {
    req.params = { orgId: '10' };

    mocks.getOrgUsers.mockResolvedValue([]);

    await controller.getOrganizationMembers(req, res, vi.fn());

    expect(mocks.getOrgUsers).toHaveBeenCalledWith(10);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should add user to organization', async () => {
    req.params = { orgId: '10' };

    mocks.addUserToOranization.mockResolvedValue({});

    await controller.addUsersToOrganizations(req, res, vi.fn());

    expect(mocks.addUserToOranization).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should remove user from organization', async () => {
    req.params = { orgId: '10' };
    req.body = { targetUserId: 5 };

    mocks.removeUserToOrganization.mockResolvedValue({ id: 5 });

    await controller.removeUsersToOrganizations(req, res, vi.fn());

    expect(mocks.removeUserToOrganization).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('should get particular user profile', async () => {
    req.params = { userId: '5' };

    mocks.getUserProfiles.mockResolvedValue({ id: 5 });

    await controller.getParticularUser(req, res, vi.fn());

    expect(mocks.getUserProfiles).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should update user in organization', async () => {
    req.params = { orgId: '10' };

    mocks.updateUserDetails.mockResolvedValue({ id: 1 });

    await controller.updateUserDetailInOrg(req, res, vi.fn());

    expect(mocks.updateUserDetails).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
