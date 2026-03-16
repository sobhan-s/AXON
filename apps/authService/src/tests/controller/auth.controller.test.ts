import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockResponse } from '../helper/mockResponse.js';

let controller: any;

const mocks = {
  login: vi.fn(),
  register: vi.fn(),
  verifyEmail: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
  logoutAllDevices: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  resendVerificationEmail: vi.fn(),
};

vi.mock('../../services/auth.service.js', () => {
  return {
    AuthService: class {
      login = mocks.login;
      register = mocks.register;
      verifyEmail = mocks.verifyEmail;
      refreshToken = mocks.refreshToken;
      logout = mocks.logout;
      logoutAllDevices = mocks.logoutAllDevices;
      forgotPassword = mocks.forgotPassword;
      resetPassword = mocks.resetPassword;
      resendVerificationEmail = mocks.resendVerificationEmail;
    },
  };
});

describe('Auth Controller', () => {
  let req: any;
  let res: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    controller = await import('../../controller/auth.controller.js');

    req = {
      body: {},
      query: {},
      cookies: {},
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('test-agent'),
      user: { id: 1 },
    };

    res = mockResponse();
  });

  it('should login successfully', async () => {
    req.body = { email: 'test@test.com', password: 'password123' };

    mocks.login.mockResolvedValue({
      user: { id: 1, email: 'test@test.com' },
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    await controller.login(req, res, vi.fn());

    expect(mocks.login).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should register successfully', async () => {
    req.body = {
      email: 'test@test.com',
      password: 'password123',
      username: 'testuser',
    };

    mocks.register.mockResolvedValue({
      user: { id: 1, email: 'test@test.com', username: 'testuser' },
    });

    await controller.register(req, res, vi.fn());

    expect(mocks.register).toHaveBeenCalledWith(req.body, '127.0.0.1');
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should verify email', async () => {
    req.query = { token: 'verify-token' };

    mocks.verifyEmail.mockResolvedValue(undefined);

    await controller.verifyEmail(req, res, vi.fn());

    expect(mocks.verifyEmail).toHaveBeenCalledWith('verify-token');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should refresh token', async () => {
    req.cookies = { refresh_token: 'refresh-token' };

    mocks.refreshToken.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });

    await controller.refreshToken(req, res, vi.fn());

    expect(mocks.refreshToken).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should logout user', async () => {
    req.cookies = { refresh_token: 'refresh-token' };

    mocks.logout.mockResolvedValue(undefined);

    await controller.logout(req, res, vi.fn());

    expect(mocks.logout).toHaveBeenCalledWith('refresh-token', 1);
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should logout all devices', async () => {
    mocks.logoutAllDevices.mockResolvedValue(undefined);

    await controller.logoutAllDevices(req, res, vi.fn());

    expect(mocks.logoutAllDevices).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should send forgot password email', async () => {
    req.body = { email: 'test@test.com' };

    mocks.forgotPassword.mockResolvedValue(undefined);

    await controller.forgotPassword(req, res, vi.fn());

    expect(mocks.forgotPassword).toHaveBeenCalledWith('test@test.com');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should reset password', async () => {
    req.query = { token: 'reset-token' };
    req.body = { newPassword: 'newpassword123' };

    mocks.resetPassword.mockResolvedValue(undefined);

    await controller.resetPassword(req, res, vi.fn());

    expect(mocks.resetPassword).toHaveBeenCalledWith(
      'reset-token',
      'newpassword123',
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should resend verification email', async () => {
    req.body = { email: 'test@test.com' };

    mocks.resendVerificationEmail.mockResolvedValue(undefined);

    await controller.resendVerificationEmail(req, res, vi.fn());

    expect(mocks.resendVerificationEmail).toHaveBeenCalledWith('test@test.com');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
