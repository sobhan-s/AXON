import { prisma } from '../index.js';
import { ApiError } from '@dam/utils';
import { logger } from '@dam/config';

export class UserRepository {
  async updateUser(
    id: number,
    data: Partial<{
      username: string;
    }>,
  ) {
    try {
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Error updating user', { error });
      throw new ApiError(500, 'Database error while updating user');
    }
  }

  async deleteme(userId: number) {
    try {
      return await prisma.user.delete({
        where: {
          id: userId,
        },
      });
    } catch (error) {
      logger.error('Error in deleting user', { error });
      throw new ApiError(500, 'Database error while delete user');
    }
  }

  async updatePassword(userId: number, newHashPassword: string) {
    try {
      return await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password: newHashPassword,
        },
      });
    } catch (error) {
      logger.error('Error in updation of password of user', { error });
      throw new ApiError(500, 'Database error while updating user password');
    }
  }
}
