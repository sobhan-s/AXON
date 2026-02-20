import { Request, Response } from 'express';
import {
  register,
  login,
  verifyEmail,
  refreshToken,
  logout,
  logoutAllDevices,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
} from '../controller/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { ApiError } from '@dam/utils';
import { CONSTANTS } from '@dam/constants';
 
jest.mock('../services/auth.service.js');
jest.mock('@dam/config', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  env_config_variable: {
    ENVIORMENT: { PROD: 'test' },
  },
}));
jest.mock('@dam/validations', () => ({
  registerSchema: { safeParse: jest.fn() },
  loginSchema: { safeParse: jest.fn() },
  verifyEmailSchema: { safeParse: jest.fn() },
  forgotPasswordSchema: { safeParse: jest.fn() },
  resetPasswordSchema: { safeParse: jest.fn() },
  resendVerificationSchema: { safeParse: jest.fn() },
}));
jest.mock('@dam/constants', () => ({
  CONSTANTS: {
    TOKEN_NAME: {
      ACCESS_TOKEN_COOKIE: 'access_token',
      REFRESH_TOKEN_COOKIE: 'refresh_token',
    },
  },
}));

import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} from '@dam/validations';

 
const mockUser:any = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  organizationId: null,
  avatarUrl: null,
  isEmailVerified: true,
  emailVerifiedAt: null,
  resetPasswordToken: null,
  isActive: true,
  lastLoginAt: null,
  lastLoginIp: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

 const mockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  query: {},
  cookies: {},
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('jest-agent'),
  ...overrides,
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

const next = jest.fn();

 
describe('AuthController', () => {
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = (AuthService as jest.MockedClass<typeof AuthService>).mock
      .instances[0] as jest.Mocked<AuthService>;
  });

 
  describe('register', () => {
    it('should return 201 with user on successful registration', async () => {
      const req = mockRequest({ body: { email: 'a@b.com', password: 'pass', username: 'user' } });
      const res = mockResponse();

      (registerSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { email: 'a@b.com', password: 'pass', username: 'user' },
      });
      authService.register.mockResolvedValue({ user: mockUser });

      await (register as Function)(req, res, next);

      expect(authService.register).toHaveBeenCalledWith(
        { email: 'a@b.com', password: 'pass', username: 'user' },
        '127.0.0.1',
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 201 }),
      );
    });

    it('should throw 400 if validation fails', async () => {
      const req = mockRequest({ body: {} });
      const res = mockResponse();

      (registerSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { message: 'Validation failed' },
      });

      await expect((register as Function)(req, res, next)).rejects.toThrow(
        new ApiError(400, 'Validation failed'),
      );
      expect(authService.register).not.toHaveBeenCalled();
    });
  });

 
  describe('login', () => {
    it('should set cookies and return 200 with user and accessToken', async () => {
      const req = mockRequest({ body: { email: 'a@b.com', password: 'pass' } });
      const res = mockResponse();

      (loginSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { email: 'a@b.com', password: 'pass' },
      });
      authService.login.mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      await (login as Function)(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        CONSTANTS.TOKEN_NAME.ACCESS_TOKEN_COOKIE,
        'access-token',
        expect.any(Object),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        CONSTANTS.TOKEN_NAME.REFRESH_TOKEN_COOKIE,
        'refresh-token',
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ accessToken: 'access-token' }),
        }),
      );
    });

    it('should throw 400 if validation fails', async () => {
      const req = mockRequest({ body: {} });
      const res = mockResponse();

      (loginSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { message: 'Validation failed' },
      });

      await expect((login as Function)(req, res, next)).rejects.toThrow(
        new ApiError(400, 'Validation failed'),
      );
    });
  });

 
  describe('verifyEmail', () => {
    it('should return 200 on successful email verification', async () => {
      const req = mockRequest({ query: { token: 'verify-token' } });
      const res = mockResponse();

      (verifyEmailSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { token: 'verify-token' },
      });
      authService.verifyEmail.mockResolvedValue(undefined);

      await (verifyEmail as Function)(req, res, next);

      expect(authService.verifyEmail).toHaveBeenCalledWith('verify-token');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should throw 400 if token is missing', async () => {
      const req = mockRequest({ query: {} });
      const res = mockResponse();

      (verifyEmailSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { message: 'Token required' },
      });

      await expect((verifyEmail as Function)(req, res, next)).rejects.toThrow(
        new ApiError(400, 'Token required'),
      );
    });
  });

 
  describe('refreshToken', () => {
    it('should set new cookies and return 200 with new accessToken', async () => {
      const req = mockRequest({
        cookies: { refresh_token: 'old-refresh-token' },
      });
      const res = mockResponse();

      authService.refreshToken.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      await (refreshToken as Function)(req, res, next);

      expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { accessToken: 'new-access-token' },
        }),
      );
    });

    it('should fall back to req.body.refreshToken if cookie is missing', async () => {
      const req = mockRequest({
        cookies: {},
        body: { refreshToken: 'body-refresh-token' },
      });
      const res = mockResponse();

      authService.refreshToken.mockResolvedValue({
        accessToken: 'new-at',
        refreshToken: 'new-rt',
      });

      await (refreshToken as Function)(req, res, next);

      expect(authService.refreshToken).toHaveBeenCalledWith('body-refresh-token');
    });

    it('should throw 401 if no refresh token provided', async () => {
      const req = mockRequest({ cookies: {}, body: {} });
      const res = mockResponse();

      await expect((refreshToken as Function)(req, res, next)).rejects.toThrow(
        new ApiError(401, 'Refresh token not provided'),
      );
    });
  });

 
  describe('logout', () => {
    it('should clear cookies and return 200', async () => {
      const req = mockRequest({
        cookies: { refresh_token: 'refresh-token' },
        body: {},
      });
      (req as any).user = { id: 1 };
      const res = mockResponse();

      authService.logout.mockResolvedValue(undefined);

      await (logout as Function)(req, res, next);

      expect(authService.logout).toHaveBeenCalledWith('refresh-token', 1);
      expect(res.clearCookie).toHaveBeenCalledWith(
        CONSTANTS.TOKEN_NAME.ACCESS_TOKEN_COOKIE,
        expect.any(Object),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        CONSTANTS.TOKEN_NAME.REFRESH_TOKEN_COOKIE,
        expect.any(Object),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should throw 401 if refresh token is missing', async () => {
      const req = mockRequest({ cookies: {}, body: {} });
      const res = mockResponse();

      await expect((logout as Function)(req, res, next)).rejects.toThrow(
        new ApiError(401, 'Refresh token not provided'),
      );
    });

    it('should throw 401 if user is not authenticated', async () => {
      const req = mockRequest({ cookies: { refresh_token: 'token' } });
      (req as any).user = undefined;
      const res = mockResponse();

      await expect((logout as Function)(req, res, next)).rejects.toThrow(
        new ApiError(401, 'Unauthorized'),
      );
    });
  });

 
  describe('logoutAllDevices', () => {
    it('should clear cookies and return 200', async () => {
      const req = mockRequest();
      (req as any).user = { id: 1 };
      const res = mockResponse();

      authService.logoutAllDevices.mockResolvedValue(undefined);

      await (logoutAllDevices as Function)(req, res, next);

      expect(authService.logoutAllDevices).toHaveBeenCalledWith(1);
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should throw 401 if user is not authenticated', async () => {
      const req = mockRequest();
      (req as any).user = undefined;
      const res = mockResponse();

      await expect((logoutAllDevices as Function)(req, res, next)).rejects.toThrow(
        new ApiError(401, 'Unauthorized'),
      );
    });
  });

 
  describe('forgotPassword', () => {
    it('should return 200 with generic message regardless of outcome', async () => {
      const req = mockRequest({ body: { email: 'a@b.com' } });
      const res = mockResponse();

      (forgotPasswordSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { email: 'a@b.com' },
      });
      authService.forgotPassword.mockResolvedValue(undefined);

      await (forgotPassword as Function)(req, res, next);

      expect(authService.forgotPassword).toHaveBeenCalledWith('a@b.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('If an account exists'),
        }),
      );
    });

    it('should throw 400 if validation fails', async () => {
      const req = mockRequest({ body: {} });
      const res = mockResponse();

      (forgotPasswordSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { message: 'Email required' },
      });

      await expect((forgotPassword as Function)(req, res, next)).rejects.toThrow(
        new ApiError(400, 'Email required'),
      );
    });
  });

 
  describe('resetPassword', () => {
    it('should return 200 on successful password reset', async () => {
      const req = mockRequest({
        query: { token: 'reset-token' },
        body: { newPassword: 'NewPass123!' },
      });
      const res = mockResponse();

      (resetPasswordSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { newPassword: 'NewPass123!' },
      });
      authService.resetPassword.mockResolvedValue(undefined);

      await (resetPassword as Function)(req, res, next);

      expect(authService.resetPassword).toHaveBeenCalledWith('reset-token', 'NewPass123!');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should throw 400 if validation fails', async () => {
      const req = mockRequest({ query: { token: 'reset-token' }, body: {} });
      const res = mockResponse();

      (resetPasswordSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { message: 'Password required' },
      });

      await expect((resetPassword as Function)(req, res, next)).rejects.toThrow(
        new ApiError(400, 'Password required'),
      );
    });
  });

 
  describe('resendVerificationEmail', () => {
    it('should return 200 with generic message', async () => {
      const req = mockRequest({ body: { email: 'a@b.com' } });
      const res = mockResponse();

      (resendVerificationSchema.safeParse as jest.Mock).mockReturnValue({
        success: true,
        data: { email: 'a@b.com' },
      });
      authService.resendVerificationEmail.mockResolvedValue(undefined);

      await (resendVerificationEmail as Function)(req, res, next);

      expect(authService.resendVerificationEmail).toHaveBeenCalledWith('a@b.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('If your email is registered'),
        }),
      );
    });

    it('should throw 400 if validation fails', async () => {
      const req = mockRequest({ body: {} });
      const res = mockResponse();

      (resendVerificationSchema.safeParse as jest.Mock).mockReturnValue({
        success: false,
        error: { message: 'Email required' },
      });

      await expect((resendVerificationEmail as Function)(req, res, next)).rejects.toThrow(
        new ApiError(400, 'Email required'),
      );
    });
  });
});