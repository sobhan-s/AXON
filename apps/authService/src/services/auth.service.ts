import bcrypt from 'bcrypt';
import { AuthRepository } from '../repository/auth.repository.js';
import { TokenService } from './token.service.js';
import { ActivityService } from '@dam/common';
import { sendPasswordResetEmail, sendVerificationEmail } from '@dam/mail';
import { ApiError } from '@dam/utils';
import { logger } from '@dam/config';

export class AuthService {
  private authRepo: AuthRepository;
  private tokenService: TokenService;
  private activityService: ActivityService;

  constructor() {
    this.authRepo = new AuthRepository();
    this.tokenService = new TokenService();
    this.activityService = new ActivityService();
  }

  async register(
    data: { email: string; password: string; username: string },
    ip: string,
  ) {
    logger.info('Register service called', { email: data.email });

    const existingUser = await this.authRepo.findUserByEmail(data.email);
    if (existingUser) {
      throw new ApiError(409, 'Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.authRepo.createUser({
      email: data.email,
      password: hashedPassword,
      username: data.username,
    });

    const rawToken = this.tokenService.generateEmailVerificationToken();
    const expiresAt = this.tokenService.getEmailVerificationTokenExpiryDate();

    await this.authRepo.createEmailVerificationToken({
      token: rawToken,
      expiresAt,
      userId: user.id,
    });

    await sendVerificationEmail(user.email, rawToken);

    await this.activityService.logActivity({
      userId: user.id,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: user.id.toString(),
      ipAddress: ip,
    });

    logger.info('User registered successfully', { userId: user.id });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  async login(email: string, password: string, ip: string, userAgent?: string) {
    logger.info('Login service called', { email });

    const user = await this.authRepo.findUserByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new ApiError(403, 'Please verify your email before logging in');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Your account has been deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.activityService.logActivity({
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'user',
        entityId: user.id.toString(),
        details: { success: false, reason: 'invalid_password' },
        ipAddress: ip,
        userAgent,
      });

      throw new ApiError(401, 'Invalid email or password');
    }

    const accessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = this.tokenService.generateRefreshToken({
      userId: user.id,
      type: 'refresh',
    });

    const refreshTokenExpiry = this.tokenService.getRefreshTokenExpiryDate();
    await this.authRepo.createRefreshToken({
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshTokenExpiry,
    });

    await this.authRepo.updateUser(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });

    await this.activityService.logActivity({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id.toString(),
      details: { success: true },
      ipAddress: ip,
      userAgent,
    });

    logger.info('User logged in successfully', { userId: user.id });

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async verifyEmail(token: string) {
    logger.info('Verify email service called');

    const verificationToken =
      await this.authRepo.findEmailVerificationToken(token);

    if (!verificationToken) {
      throw new ApiError(400, 'Invalid verification token');
    }

    if (verificationToken.isUsed) {
      throw new ApiError(400, 'Verification token already used');
    }

    if (new Date() > verificationToken.expiresAt) {
      throw new ApiError(
        400,
        'Verification token has expired. Please request a new one',
      );
    }

    await this.authRepo.markEmailTokenUsed(verificationToken.id);

    await this.authRepo.updateUser(verificationToken.userId, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    await this.activityService.logActivity({
      userId: verificationToken.userId,
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: verificationToken.userId.toString(),
      details: { emailVerified: true },
    });

    logger.info('Email verified successfully', {
      userId: verificationToken.userId,
    });
  }

  async refreshToken(token: string) {
    logger.info('Refresh token service called');

    const payload = this.tokenService.verifyRefreshToken(token);

    const storedToken = await this.authRepo.findRefreshToken(token);
    console.log('adsfasdfasdf', storedToken);

    if (!storedToken) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (storedToken.revoked) {
      await this.authRepo.revokeAllUserRefreshTokens(payload.userId);

      logger.warn('Refresh token reuse detected', { userId: payload.userId });
      throw new ApiError(401, 'Token reuse detected. Please login again');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new ApiError(401, 'Refresh token expired. Please login again');
    }

    const user = storedToken.user;
    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated');
    }

    await this.authRepo.revokeRefreshToken(token);

    const newAccessToken = this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const newRefreshToken = this.tokenService.generateRefreshToken({
      userId: user.id,
      type: 'refresh',
    });

    await this.authRepo.createRefreshToken({
      token: newRefreshToken,
      userId: user.id,
      expiresAt: this.tokenService.getRefreshTokenExpiryDate(),
    });

    logger.info('Tokens refreshed successfully', { userId: user.id });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string, userId: number) {
    logger.info('Logout service called', { userId });

    const storedToken = await this.authRepo.findRefreshToken(refreshToken);

    if (storedToken) {
      await this.authRepo.revokeRefreshToken(refreshToken);
    }

    await this.activityService.logActivity({
      userId,
      action: 'USER_LOGOUT',
      entityType: 'user',
      entityId: userId.toString(),
    });

    logger.info('User logged out successfully', { userId });
  }

  async logoutAllDevices(userId: number) {
    logger.info('Logout all devices service called', { userId });

    await this.authRepo.revokeAllUserRefreshTokens(userId);

    await this.activityService.logActivity({
      userId,
      action: 'USER_LOGOUT',
      entityType: 'user',
      entityId: userId.toString(),
      details: { allDevices: true },
    });
  }

  async forgotPassword(email: string) {
    logger.info('Forgot password service called', { email });

    const user = await this.authRepo.findUserByEmail(email);

    if (!user) {
      logger.warn('Forgot password: user not found', { email });
      return;
    }

    if (!user.isEmailVerified) {
      return;
    }

    const rawToken = this.tokenService.generatePasswordResetToken();
    const expiresAt = this.tokenService.getPasswordResetTokenExpiryDate();

    await this.authRepo.createPasswordResetToken({
      token: rawToken,
      expiresAt,
      userId: user.id,
    });

    await sendPasswordResetEmail(user.email, rawToken);

    logger.info('Password reset email sent', { userId: user.id });
  }

  async resetPassword(token: string, newPassword: string) {
    logger.info('Reset password service called');

    const resetToken = await this.authRepo.findPasswordResetToken(token);

    if (!resetToken) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    if (resetToken.isUsed) {
      throw new ApiError(400, 'Reset token already used');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new ApiError(
        400,
        'Reset token has expired. Please request a new one',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.authRepo.updateUser(resetToken.userId, {
      password: hashedPassword,
    });

    await this.authRepo.markPasswordResetTokenUsed(resetToken.id);

    await this.authRepo.revokeAllUserRefreshTokens(resetToken.userId);

    await this.activityService.logActivity({
      userId: resetToken.userId,
      action: 'USER_UPDATED',
      entityType: 'user',
      entityId: resetToken.userId.toString(),
      details: { passwordReset: true },
    });

    logger.info('Password reset successfully', { userId: resetToken.userId });
  }

  async resendVerificationEmail(email: string) {
    logger.info('Resend verification email called', { email });

    const user = await this.authRepo.findUserByEmail(email);

    if (!user) {
      return;
    }

    if (user.isEmailVerified) {
      throw new ApiError(400, 'Email already verified');
    }

    const rawToken = this.tokenService.generateEmailVerificationToken();
    const expiresAt = this.tokenService.getEmailVerificationTokenExpiryDate();

    await this.authRepo.createEmailVerificationToken({
      token: rawToken,
      expiresAt,
      userId: user.id,
    });

    await sendVerificationEmail(user.email, rawToken);

    logger.info('Verification email resent', { userId: user.id });
  }
}
