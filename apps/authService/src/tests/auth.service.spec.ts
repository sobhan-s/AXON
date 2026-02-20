import bcrypt from 'bcrypt';
import { AuthService } from '../services/auth.service.js';
import { AuthRepository } from '../repository/auth.repository.js';
import { TokenService } from '../services/token.service.js';
import { ActivityService } from '@dam/common';
import { sendPasswordResetEmail, sendVerificationEmail } from '@dam/mail';
import { ApiError } from '@dam/utils';

jest.mock('bcrypt');
jest.mock('../repository/auth.repository.js');
jest.mock('../services/token.service.js');
jest.mock('@dam/common');
jest.mock('@dam/mail');
jest.mock('@dam/config', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockUser: any = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  password: 'hashedpassword',
  isEmailVerified: true,
  isActive: true,
  lastLoginAt: null,
  lastLoginIp: null,
};

const mockVerificationToken = {
  id: 10,
  token: 'raw-token-123',
  userId: 1,
  isUsed: false,
  expiresAt: new Date(Date.now() + 60_000),
};

const mockRefreshTokenRecord = {
  id: 20,
  token: 'refreshTokne',
  userId: 1,
  revoked: false,
  expiresAt: new Date(Date.now() + 60_000),
  user: mockUser,
};

const mockResetToken = {
  id: 30,
  token: 'resetToken',
  userId: 1,
  isUsed: false,
  expiresAt: new Date(Date.now() + 60_000),
};

describe('AuthService', () => {
  let service: AuthService;
  let authRepo: jest.Mocked<AuthRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let activityService: jest.Mocked<ActivityService>;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AuthService();

    authRepo = (AuthRepository as jest.MockedClass<typeof AuthRepository>).mock
      .instances[0] as jest.Mocked<AuthRepository>;
    tokenService = (TokenService as jest.MockedClass<typeof TokenService>).mock
      .instances[0] as jest.Mocked<TokenService>;
    activityService = (
      ActivityService as jest.MockedClass<typeof ActivityService>
    ).mock.instances[0] as jest.Mocked<ActivityService>;
  });

  describe('register', () => {
    const registerData = {
      email: 'new@example.com',
      password: 'plainPassword123',
      username: 'newuser',
    };
    const ip = '127.0.0.1';

    it('should register a new user and return user without password', async () => {
      authRepo.findUserByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      authRepo.createUser.mockResolvedValue({
        ...mockUser,
        email: registerData.email,
        username: registerData.username,
      });
      tokenService.generateEmailVerificationToken.mockReturnValue('raw-token');
      tokenService.getEmailVerificationTokenExpiryDate.mockReturnValue(
        new Date(),
      );
      authRepo.createEmailVerificationToken.mockResolvedValue(undefined as any);
      (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);
      activityService.logActivity.mockResolvedValue(undefined as any);

      const result = await service.register(registerData, ip);

      expect(result.user).not.toHaveProperty('password');
      expect(authRepo.createUser).toHaveBeenCalledWith({
        email: registerData.email,
        password: 'hashedpassword',
        username: registerData.username,
      });
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        'raw-token',
      );
      expect(activityService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'USER_CREATED' }),
      );
    });

    it('should throw 409 if email is already registered', async () => {
      authRepo.findUserByEmail.mockResolvedValue(mockUser as any);

      await expect(service.register(registerData, ip)).rejects.toThrow(
        new ApiError(409, 'Email already registered'),
      );
      expect(authRepo.createUser).not.toHaveBeenCalled();
    });

    it('should hash the password with salt 10', async () => {
      authRepo.findUserByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      authRepo.createUser.mockResolvedValue(mockUser as any);
      tokenService.generateEmailVerificationToken.mockReturnValue('t');
      tokenService.getEmailVerificationTokenExpiryDate.mockReturnValue(
        new Date(),
      );
      authRepo.createEmailVerificationToken.mockResolvedValue(undefined as any);
      (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);
      activityService.logActivity.mockResolvedValue(undefined as any);

      await service.register(registerData, ip);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 10);
    });
  });

  describe('login', () => {
    const ip = '127.0.0.1';
    const userAgent = 'jest-agent';

    it('should return tokens and user without password on valid credentials', async () => {
      authRepo.findUserByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      tokenService.generateAccessToken.mockReturnValue('access-token');
      tokenService.generateRefreshToken.mockReturnValue('refresh-token');
      tokenService.getRefreshTokenExpiryDate.mockReturnValue(new Date());
      authRepo.createRefreshToken.mockResolvedValue(undefined as any);
      authRepo.updateUser.mockResolvedValue(undefined as any);
      activityService.logActivity.mockResolvedValue(undefined as any);

      const result = await service.login(
        mockUser.email,
        'plainPassword123',
        ip,
        userAgent,
      );

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw 401 if user is not found', async () => {
      authRepo.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.login('unknown@example.com', 'pass', ip),
      ).rejects.toThrow(new ApiError(401, 'Invalid email or password'));
    });

    it('should throw 403 if email is not verified', async () => {
      authRepo.findUserByEmail.mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
      } as any);

      await expect(service.login(mockUser.email, 'pass', ip)).rejects.toThrow(
        new ApiError(403, 'Please verify your email before logging in'),
      );
    });

    it('should throw 403 if account is deactivated', async () => {
      authRepo.findUserByEmail.mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as any);

      await expect(service.login(mockUser.email, 'pass', ip)).rejects.toThrow(
        new ApiError(403, 'Your account has been deactivated'),
      );
    });

    it('should throw 401 and log failed activity on wrong password', async () => {
      authRepo.findUserByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      activityService.logActivity.mockResolvedValue(undefined as any);

      await expect(
        service.login(mockUser.email, 'wrongpass', ip),
      ).rejects.toThrow(new ApiError(401, 'Invalid email or password'));
      expect(activityService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          details: { success: false, reason: 'invalid_password' },
        }),
      );
    });

    it('should update lastLoginAt and lastLoginIp on successful login', async () => {
      authRepo.findUserByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      tokenService.generateAccessToken.mockReturnValue('at');
      tokenService.generateRefreshToken.mockReturnValue('rt');
      tokenService.getRefreshTokenExpiryDate.mockReturnValue(new Date());
      authRepo.createRefreshToken.mockResolvedValue(undefined as any);
      authRepo.updateUser.mockResolvedValue(undefined as any);
      activityService.logActivity.mockResolvedValue(undefined as any);

      await service.login(mockUser.email, 'plainPassword123', ip);

      expect(authRepo.updateUser).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ lastLoginIp: ip }),
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      authRepo.findEmailVerificationToken.mockResolvedValue(
        mockVerificationToken as any,
      );
      authRepo.markEmailTokenUsed.mockResolvedValue(undefined as any);
      authRepo.updateUser.mockResolvedValue(undefined as any);
      activityService.logActivity.mockResolvedValue(undefined as any);

      await expect(service.verifyEmail('token-123')).resolves.toBeUndefined();
      expect(authRepo.markEmailTokenUsed).toHaveBeenCalledWith(
        mockVerificationToken.id,
      );
      expect(authRepo.updateUser).toHaveBeenCalledWith(
        mockVerificationToken.userId,
        expect.objectContaining({ isEmailVerified: true }),
      );
    });

    it('should throw 400 if token does not exist', async () => {
      authRepo.findEmailVerificationToken.mockResolvedValue(null);

      await expect(service.verifyEmail('bad-token')).rejects.toThrow(
        new ApiError(400, 'Invalid verification token'),
      );
    });

    it('should throw 400 if token is already used', async () => {
      authRepo.findEmailVerificationToken.mockResolvedValue({
        ...mockVerificationToken,
        isUsed: true,
      } as any);

      await expect(service.verifyEmail('token-123')).rejects.toThrow(
        new ApiError(400, 'Verification token already used'),
      );
    });

    it('should throw 400 if token is expired', async () => {
      authRepo.findEmailVerificationToken.mockResolvedValue({
        ...mockVerificationToken,
        expiresAt: new Date(Date.now() - 1000),
      } as any);

      await expect(service.verifyEmail('raw-token-123')).rejects.toThrow(
        new ApiError(
          400,
          'Verification token has expired. Please request a new one',
        ),
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new access and refresh tokens', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        userId: 1,
        type: 'refresh',
      });
      authRepo.findRefreshToken.mockResolvedValue(
        mockRefreshTokenRecord as any,
      );
      authRepo.revokeRefreshToken.mockResolvedValue(undefined as any);
      tokenService.generateAccessToken.mockReturnValue('new-access-token');
      tokenService.generateRefreshToken.mockReturnValue('new-refresh-token');
      tokenService.getRefreshTokenExpiryDate.mockReturnValue(new Date());
      authRepo.createRefreshToken.mockResolvedValue(undefined as any);

      const result = await service.refreshToken('refresh-token-abc');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(authRepo.revokeRefreshToken).toHaveBeenCalledWith(
        'refresh-token-abc',
      );
    });

    it('should throw 401 if token not found in DB', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        userId: 1,
        type: 'refresh',
      });
      authRepo.findRefreshToken.mockResolvedValue(null);

      await expect(service.refreshToken('bad-token')).rejects.toThrow(
        new ApiError(401, 'Invalid refresh token'),
      );
    });

    it('should revoke all tokens and throw 401 on token reuse', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        userId: 1,
        type: 'refresh',
      });
      authRepo.findRefreshToken.mockResolvedValue({
        ...mockRefreshTokenRecord,
        revoked: true,
      } as any);
      authRepo.revokeAllUserRefreshTokens.mockResolvedValue(undefined as any);

      await expect(service.refreshToken('reused-token')).rejects.toThrow(
        new ApiError(401, 'Token reuse detected. Please login again'),
      );
      expect(authRepo.revokeAllUserRefreshTokens).toHaveBeenCalledWith(1);
    });

    it('should throw 401 if refresh token is expired', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        userId: 1,
        type: 'refresh',
      });
      authRepo.findRefreshToken.mockResolvedValue({
        ...mockRefreshTokenRecord,
        expiresAt: new Date(Date.now() - 1000),
      } as any);

      await expect(service.refreshToken('expired-token')).rejects.toThrow(
        new ApiError(401, 'Refresh token expired. Please login again'),
      );
    });

    it('should throw 403 if user account is deactivated', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        userId: 1,
        type: 'refresh',
      });
      authRepo.findRefreshToken.mockResolvedValue({
        ...mockRefreshTokenRecord,
        user: { ...mockUser, isActive: false },
      } as any);

      await expect(service.refreshToken('valid-token')).rejects.toThrow(
        new ApiError(403, 'Account is deactivated'),
      );
    });
  });

  describe('logout', () => {
    it('should revoke token and log activity', async () => {
      authRepo.findRefreshToken.mockResolvedValue(
        mockRefreshTokenRecord as any,
      );
      authRepo.revokeRefreshToken.mockResolvedValue(undefined as any);
      activityService.logActivity.mockResolvedValue(undefined as any);

      await service.logout('refresh-token-abc', 1);

      expect(authRepo.revokeRefreshToken).toHaveBeenCalledWith(
        'refresh-token-abc',
      );
      expect(activityService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'USER_LOGOUT', userId: 1 }),
      );
    });

    it('should still log activity even if token is not found', async () => {
      authRepo.findRefreshToken.mockResolvedValue(null);
      activityService.logActivity.mockResolvedValue(undefined as any);

      await service.logout('non-existent-token', 1);

      expect(authRepo.revokeRefreshToken).not.toHaveBeenCalled();
      expect(activityService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'USER_LOGOUT' }),
      );
    });
  });

  describe('logoutAllDevices', () => {
    it('should revoke all tokens and log activity with allDevices flag', async () => {
      authRepo.revokeAllUserRefreshTokens.mockResolvedValue(undefined as any);
      activityService.logActivity.mockResolvedValue(undefined as any);

      await service.logoutAllDevices(1);

      expect(authRepo.revokeAllUserRefreshTokens).toHaveBeenCalledWith(1);
      expect(activityService.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({ details: { allDevices: true } }),
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email for a verified user', async () => {
      authRepo.findUserByEmail.mockResolvedValue(mockUser as any);
      tokenService.generatePasswordResetToken.mockReturnValue('reset-token');
      tokenService.getPasswordResetTokenExpiryDate.mockReturnValue(new Date());
      authRepo.createPasswordResetToken.mockResolvedValue(undefined as any);
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      await service.forgotPassword(mockUser.email);

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        mockUser.email,
        'reset-token',
      );
    });

    it('should silently return if user is not found (no email leak)', async () => {
      authRepo.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword('unknown@example.com'),
      ).resolves.toBeUndefined();
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should silently return if user email is not verified', async () => {
      authRepo.findUserByEmail.mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
      } as any);

      await expect(
        service.forgotPassword(mockUser.email),
      ).resolves.toBeUndefined();
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password and revoke all refresh tokens', async () => {
      authRepo.findPasswordResetToken.mockResolvedValue(mockResetToken as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      authRepo.updateUser.mockResolvedValue(undefined as any);
      authRepo.markPasswordResetTokenUsed.mockResolvedValue(undefined as any);
      authRepo.revokeAllUserRefreshTokens.mockResolvedValue(undefined as any);
      activityService.logActivity.mockResolvedValue(undefined as any);

      await service.resetPassword('reset-token-xyz', 'NewSecurePass!');

      expect(bcrypt.hash).toHaveBeenCalledWith('NewSecurePass!', 12);
      expect(authRepo.updateUser).toHaveBeenCalledWith(
        mockResetToken.userId,
        expect.objectContaining({ password: 'newHashedPassword' }),
      );
      expect(authRepo.revokeAllUserRefreshTokens).toHaveBeenCalledWith(
        mockResetToken.userId,
      );
    });

    it('should throw 400 if reset token is not found', async () => {
      authRepo.findPasswordResetToken.mockResolvedValue(null);

      await expect(
        service.resetPassword('bad-token', 'newPass'),
      ).rejects.toThrow(new ApiError(400, 'Invalid or expired reset token'));
    });

    it('should throw 400 if reset token is already used', async () => {
      authRepo.findPasswordResetToken.mockResolvedValue({
        ...mockResetToken,
        isUsed: true,
      } as any);

      await expect(
        service.resetPassword('reset-token-xyz', 'newPass'),
      ).rejects.toThrow(new ApiError(400, 'Reset token already used'));
    });

    it('should throw 400 if reset token has expired', async () => {
      authRepo.findPasswordResetToken.mockResolvedValue({
        ...mockResetToken,
        expiresAt: new Date(Date.now() - 1000),
      } as any);

      await expect(
        service.resetPassword('reset-token-xyz', 'newPass'),
      ).rejects.toThrow(
        new ApiError(400, 'Reset token has expired. Please request a new one'),
      );
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email for unverified user', async () => {
      authRepo.findUserByEmail.mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
      } as any);
      tokenService.generateEmailVerificationToken.mockReturnValue(
        'new-verify-token',
      );
      tokenService.getEmailVerificationTokenExpiryDate.mockReturnValue(
        new Date(),
      );
      authRepo.createEmailVerificationToken.mockResolvedValue(undefined as any);
      (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

      await service.resendVerificationEmail(mockUser.email);

      expect(sendVerificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        'new-verify-token',
      );
    });

    it('should silently return if user is not found', async () => {
      authRepo.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.resendVerificationEmail('unknown@example.com'),
      ).resolves.toBeUndefined();
      expect(sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should throw 400 if email is already verified', async () => {
      authRepo.findUserByEmail.mockResolvedValue(mockUser as any); // isEmailVerified: true

      await expect(
        service.resendVerificationEmail(mockUser.email),
      ).rejects.toThrow(new ApiError(400, 'Email already verified'));
    });
  });
});
