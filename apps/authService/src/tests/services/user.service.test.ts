import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import { ApiError } from '@dam/utils';

const repoMock = {
  updateUser: vi.fn(),
  deleteme: vi.fn(),
  updatePassword: vi.fn(),
  findOrgById: vi.fn(),
  getOrganizationMembers: vi.fn(),
  addUsersToOrganizations: vi.fn(),
  removeUsersToOrganizations: vi.fn(),
  getParticularUser: vi.fn(),
  updateUserProfileAdminLevel: vi.fn(),
};

const authRepoMock = {
  getFindUserById: vi.fn(),
  findUserById: vi.fn(),
};

const activityMock = {
  logActivity: vi.fn(),
};

vi.mock('../../repository/user.repository.js', () => {
  return {
    UserRepository: class {
      updateUser = repoMock.updateUser;
      deleteme = repoMock.deleteme;
      updatePassword = repoMock.updatePassword;
      findOrgById = repoMock.findOrgById;
      getOrganizationMembers = repoMock.getOrganizationMembers;
      addUsersToOrganizations = repoMock.addUsersToOrganizations;
      removeUsersToOrganizations = repoMock.removeUsersToOrganizations;
      getParticularUser = repoMock.getParticularUser;
      updateUserProfileAdminLevel = repoMock.updateUserProfileAdminLevel;
    },
  };
});

vi.mock('../../repository/auth.repository.js', () => {
  return {
    AuthRepository: class {
      getFindUserById = authRepoMock.getFindUserById;
      findUserById = authRepoMock.findUserById;
    },
  };
});

vi.mock('@dam/common', () => {
  return {
    ActivityService: class {
      logActivity = activityMock.logActivity;
    },
  };
});

vi.mock('bcrypt');

import { userService } from '../../services/user.service.js';

describe('UserService', () => {
  let service: userService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new userService();
  });

  it('should get current user', async () => {
    authRepoMock.getFindUserById.mockResolvedValue({
      id: 1,
      username: 'test',
    });

    const result = await service.getMe(1);

    expect(authRepoMock.getFindUserById).toHaveBeenCalledWith(1);
    expect(result.id).toBe(1);
  });

  it('should throw error if user not found', async () => {
    authRepoMock.getFindUserById.mockResolvedValue(null);

    await expect(service.getMe(1)).rejects.toThrow(ApiError);
  });

  it('should update user', async () => {
    repoMock.updateUser.mockResolvedValue({
      id: 1,
      username: 'newname',
    });

    const result = await service.updateMe(1, { username: 'newname' });

    expect(repoMock.updateUser).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.username).toBe('newname');
  });

  it('should change password', async () => {
    authRepoMock.findUserById.mockResolvedValue({
      id: 1,
      password: 'hashed',
    });
    (bcrypt.compare as any).mockResolvedValue(true);
    (bcrypt.genSalt as any).mockResolvedValue('salt');
    (bcrypt.hash as any).mockResolvedValue('newhash');

    await service.changePassword(1, {
      currentPassword: 'old',
      newPassword: 'new',
    });

    expect(repoMock.updatePassword).toHaveBeenCalled();
  });

  it('should throw error if current password incorrect', async () => {
    authRepoMock.findUserById.mockResolvedValue({
      id: 1,
      password: 'hashed',
    });
    (bcrypt.compare as any).mockResolvedValue(false);

    await expect(
      service.changePassword(1, {
        currentPassword: 'wrong',
        newPassword: 'new',
      }),
    ).rejects.toThrow(ApiError);
  });

  it('should get organization users', async () => {
    repoMock.findOrgById.mockResolvedValue({ id: 1 });

    repoMock.getOrganizationMembers.mockResolvedValue([{ id: 2 }, { id: 3 }]);

    const result = await service.getOrgUsers(1);

    expect(result.OrgUsers.length).toBe(2);
  });

  it('should add user to organization', async () => {
    repoMock.findOrgById.mockResolvedValue({ id: 1 });
    (bcrypt.hash as any).mockResolvedValue('hashed');

    repoMock.addUsersToOrganizations.mockResolvedValue({
      id: 10,
      email: 'test@test.com',
    });

    const result = await service.addUserToOranization(
      1,
      1,
      '127.0.0.1',
      'agent',
      {
        username: 'test',
        email: 'test@test.com',
        password: '123',
        roleId: 1,
      },
    );

    expect(repoMock.addUsersToOrganizations).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.createdUser.id).toBe(10);
  });

  it('should remove user from organization', async () => {
    repoMock.findOrgById.mockResolvedValue({ id: 1 });

    repoMock.removeUsersToOrganizations.mockResolvedValue({
      id: 5,
    });

    const result = await service.removeUserToOrganization(
      1,
      1,
      5,
      '127.0.0.1',
      'agent',
    );

    expect(repoMock.removeUsersToOrganizations).toHaveBeenCalledWith(5, 1);
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.id).toBe(5);
  });

  it('should fetch user profile', async () => {
    repoMock.getParticularUser.mockResolvedValue({
      id: 1,
      username: 'test',
    });

    const result = await service.getUserProfiles(1);

    expect(result?.username).toBe('test');
  });

  it('should update user details by admin', async () => {
    repoMock.findOrgById.mockResolvedValue({ id: 1 });

    repoMock.updateUserProfileAdminLevel.mockResolvedValue({
      id: 1,
      username: 'updated',
    });

    const result = await service.updateUserDetails(1, 'agent', '127.0.0.1', {
      username: 'updated',
    });

    expect(repoMock.updateUserProfileAdminLevel).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.username).toBe('updated');
  });
});
