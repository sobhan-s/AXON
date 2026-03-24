import { ActivityService, TokenService } from '@dam/common';
import { logger } from '@dam/config';
import { AuthRepository, UserRepository } from '@dam/repository';
import { ApiError } from '@dam/utils';
import bcrypt from 'bcrypt';

export class userService {
  private activityService: ActivityService;
  private authRepo: AuthRepository;
  private userRepo: UserRepository;

  constructor() {
    this.authRepo = new AuthRepository();
    this.activityService = new ActivityService();
    this.userRepo = new UserRepository();
  }

  async getMe(userid: number) {
    logger.info('Fetching current user', { userid });

    const user = await this.authRepo.getFindUserById(userid);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    logger.info('User info got successfully ');
    return user;
  }

  async updateMe(
    userid: number,
    data: {
      username?: string;
    },
  ) {
    logger.info('updating current user services', { userid });

    const updatedUser = this.userRepo.updateUser(userid, data);

    if (!updatedUser) {
      throw new ApiError(500, 'User updations not succesfully because of ');
    }

    this.activityService.logActivity({
      userId: userid,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: userid.toString(),
      details: {
        currendata: data,
        updatedData: updatedUser,
      },
    });

    logger.info('User data updated got successfully ');
    return updatedUser;
  }

  async deleteMe(userId: number) {
    logger.info('deleting the current user services', { userId });

    const deletUser = this.userRepo.deleteme(userId);

    logger.info('user deleted successfully');
  }

  async changePassword(
    userId: number,
    data: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    logger.info('Attempting to change password', { userId });

    const user = await this.authRepo.findUserById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new ApiError(404, 'Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(data.newPassword, salt);

    this.userRepo.updatePassword(userId, newPasswordHash);

    logger.info('Password changed successfully', { userId });
  }

  async getOrgUsers(orgId: number) {
    logger.info(
      'get the organizaiton users belong to the organization of admin',
    );

    const isOrgExist = await this.userRepo.findOrgById(orgId);

    if (!isOrgExist) {
      throw new ApiError(404, 'Organization is not found');
    }

    const OrgUsers = await this.userRepo.getOrganizationMembers(orgId);

    return {
      OrgUsers,
    };
  }

  async addUserToOranization(
    orgId: number,
    userId: number,
    ip: string,
    userAgent: string,
    data: {
      username: string;
      email: string;
      password: string;
      roleId: number;
    },
  ) {
    logger.info('add user to the organization in admin level in service layer');

    const isOrgExist = await this.userRepo.findOrgById(orgId);

    if (!isOrgExist) {
      throw new ApiError(404, 'Organization does not exist');
    }

    const hassedPassword = await bcrypt.hash(data.password, 12);

    const createdUser = await this.userRepo.addUsersToOrganizations(
      userId,
      orgId,
      { ...data, password: hassedPassword },
    );

    if (!createdUser.id) {
      throw new ApiError(
        500,
        'while creating user in admin level some server error has been occuered',
      );
    }

    this.activityService.logActivity({
      userId: createdUser.id,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: createdUser.id.toString(),
      details: {
        currendata: data,
        updatedData: createdUser,
      },
      userAgent: userAgent,
      ipAddress: ip,
    });

    logger.info('Creation of user in admin level successfully created ');

    return {
      createdUser,
    };
  }

  async removeUserToOrganization(
    orgId: number,
    userId: number,
    targetUserId: number,
    ip: string,
    userAgent: string,
  ) {
    logger.info('Removing the user from orgs service layer');

    const isOrgExist = await this.userRepo.findOrgById(orgId);

    if (!isOrgExist) {
      throw new ApiError(404, 'Organization is not found');
    }

    const removedUser = await this.userRepo.removeUsersToOrganizations(
      targetUserId,
      orgId,
    );

    this.activityService.logActivity({
      userId: removedUser.id,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: removedUser.id.toString(),
      details: {
        currendata: {
          orgId,
          userId,
          targetUserId,
        },
        details: `user ${userId} removed user ${targetUserId} from this organizations ${orgId}`,
      },
      userAgent: userAgent,
      ipAddress: ip,
    });

    return removedUser;
  }

  async getUserProfiles(userId: number) {
    logger.info('Giveme the userDetails in service layer');

    const userDetails = await this.userRepo.getParticularUser(userId);

    logger.info('UserProfile detials fetched successfully');

    return userDetails;
  }

  async updateUserDetails(
    orgId: number,
    userAgent: string,
    ip: string,
    data: {
      email?: string;
      username?: string;
      isActive?: boolean;
      roleId?: number;
    },
  ) {
    logger.info('update the userDetails info in service layer');

    const isOrgExist = await this.userRepo.findOrgById(orgId);

    if (!isOrgExist) {
      throw new ApiError(404, 'Organization is does not exist');
    }

    const updatedData = await this.userRepo.updateUserProfileAdminLevel(
      orgId,
      data,
    );

    this.activityService.logActivity({
      userId: updatedData.id,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: updatedData.id.toString(),
      details: {
        currendata: data,
        updatedData: updatedData,
      },
      userAgent: userAgent,
      ipAddress: ip,
    });

    logger.info('user data is updated successfully in adminlevel');

    return updatedData;
  }
}
