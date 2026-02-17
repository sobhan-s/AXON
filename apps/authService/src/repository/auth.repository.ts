import { prisma } from '../index.js';
import { ApiError } from '@dam/utils';
import { logger } from '@dam/config';

export class AuthRepository {
  async findUserByEmail(email: string) {
    try {
      logger.info('Finding user by email', { email });
      return await prisma.user.findUnique({ where: { email } });
    } catch (error) {
      logger.error('Error finding user by email', { error });
      throw new ApiError(500, 'Database error while fetching user');
    }
  }

  async createUser(data: any) {
    try {
      logger.info('Creating new user', { email: data.email });
      return await prisma.user.create({ data });
    } catch (error) {
      logger.error('Error creating user', { error });
      throw new ApiError(500, 'Database error while creating user');
    }
  }

  async updateUser(id: number, data: any) {
    try {
      logger.info('Updating user', { id });
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Error updating user', { error });
      throw new ApiError(500, 'Database error while updating user');
    }
  }

  async createEmailVerificationToken(data: any) {
    try {
      return await prisma.emailVerificationToken.create({ data });
    } catch (error) {
      logger.error('Error creating email token', { error });
      throw new ApiError(500, 'Database error while creating token');
    }
  }

  async findEmailVerificationToken(token: string) {
    try {
      return await prisma.emailVerificationToken.findUnique({
        where: { token },
      });
    } catch (error) {
      logger.error('Error fetching email token', { error });
      throw new ApiError(500, 'Database error while fetching token');
    }
  }
}
