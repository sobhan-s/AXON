import { PostgresClient as prisma } from '@dam/postgresql_db';
import { ApiError } from '@dam/utils';
import { logger } from '@dam/config';

export class AuthRepository {
  async findUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      logger.error('Error finding user by email', { error });
      throw new ApiError(500, 'Database error while fetching user');
    }
  }

  async findUserById(id: number) {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Error finding user by id', { error });
      throw new ApiError(500, 'Database error while fetching user');
    }
  }

  async createUser(data: {
    email: string;
    password: string;
    username: string;
  }) {
    try {
      return await prisma.user.create({ data });
    } catch (error) {
      logger.error('Error creating user', { error });
      throw new ApiError(500, 'Database error while creating user');
    }
  }

  async updateUser(
    id: number,
    data: Partial<{
      isEmailVerified: boolean;
      emailVerifiedAt: Date;
      isActive: boolean;
      lastLoginAt: Date;
      lastLoginIp: string;
      resetPasswordToken: string | null;
      resetPasswordExpiry: Date | null;
      password: string;
      avatarUrl: string;
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

  async createEmailVerificationToken(data: {
    token: string;
    expiresAt: Date;
    userId: number;
  }) {
    try {
      await prisma.emailVerificationToken.deleteMany({
        where: {
          userId: data.userId,
          isUsed: false,
        },
      });

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
        include: { user: true },
      });
    } catch (error) {
      logger.error('Error fetching email token', { error });
      throw new ApiError(500, 'Database error while fetching token');
    }
  }

  async markEmailTokenUsed(id: number) {
    try {
      return await prisma.emailVerificationToken.update({
        where: { id },
        data: { isUsed: true },
      });
    } catch (error) {
      logger.error('Error marking email token as used', { error });
      throw new ApiError(500, 'Database error');
    }
  }

  async createRefreshToken(data: {
    token: string;
    userId: number;
    expiresAt: Date;
  }) {
    try {
      return await prisma.refreshToken.create({ data });
    } catch (error) {
      logger.error('Error creating refresh token', { error });
      throw new ApiError(500, 'Database error while creating refresh token');
    }
  }

  async findRefreshToken(token: string) {
    try {
      return await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      });
    } catch (error) {
      logger.error('Error finding refresh token', { error });
      throw new ApiError(500, 'Database error while fetching refresh token');
    }
  }

  async revokeRefreshToken(token: string) {
    try {
      return await prisma.refreshToken.update({
        where: { token },
        data: { revoked: true },
      });
    } catch (error) {
      logger.error('Error revoking refresh token', { error });
      throw new ApiError(500, 'Database error while revoking token');
    }
  }

  async revokeAllUserRefreshTokens(userId: number) {
    try {
      return await prisma.refreshToken.updateMany({
        where: {
          userId,
          revoked: false,
        },
        data: { revoked: true },
      });
    } catch (error) {
      logger.error('Error revoking all refresh tokens', { error });
      throw new ApiError(500, 'Database error');
    }
  }

  async createPasswordResetToken(data: {
    token: string;
    expiresAt: Date;
    userId: number;
  }) {
    try {
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: data.userId,
          isUsed: false,
        },
      });

      return await prisma.passwordResetToken.create({ data });
    } catch (error) {
      logger.error('Error creating password reset token', { error });
      throw new ApiError(500, 'Database error');
    }
  }

  async findPasswordResetToken(token: string) {
    try {
      return await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });
    } catch (error) {
      logger.error('Error finding password reset token', { error });
      throw new ApiError(500, 'Database error');
    }
  }

  async markPasswordResetTokenUsed(id: number) {
    try {
      return await prisma.passwordResetToken.update({
        where: { id },
        data: { isUsed: true },
      });
    } catch (error) {
      logger.error('Error marking password reset token as used', { error });
      throw new ApiError(500, 'Database error');
    }
  }
}
