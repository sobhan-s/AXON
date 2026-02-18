import { ActivityService, TokenService } from '@dam/common';
import { logger } from '@dam/config';
import { AuthRepository } from '../repository/auth.repository.js';
import { ApiError } from '@dam/utils';
import { UserRepository } from '../repository/user.repository.js';
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

    const user = this.authRepo.findUserById(userid);

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
}
