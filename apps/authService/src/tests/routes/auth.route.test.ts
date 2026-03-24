import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let app: any;

const mocks = {
  register: vi.fn(),
  login: vi.fn(),
  verifyEmail: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
  logoutAllDevices: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  resendVerificationEmail: vi.fn(),
};

vi.mock('../../controller/auth.controller.js', () => ({
  register: mocks.register,
  login: mocks.login,
  verifyEmail: mocks.verifyEmail,
  refreshToken: mocks.refreshToken,
  logout: mocks.logout,
  logoutAllDevices: mocks.logoutAllDevices,
  forgotPassword: mocks.forgotPassword,
  resetPassword: mocks.resetPassword,
  resendVerificationEmail: mocks.resendVerificationEmail,
}));

vi.mock('@dam/middlewares', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 1 };
    next();
  },
  rateLimiter: () => (_req: any, _res: any, next: any) => next(),
}));

describe('Auth Routes', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const router = (await import('../../routes/auth.routes.js')).default;

    app = express();
    app.use(express.json());
    app.use('/api/auth', router);
  });

  it('/register', async () => {
    mocks.register.mockImplementation((req, res) =>
      res.status(201).json({ ok: true }),
    );

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@mail.com', password: '123456' });

    expect(res.status).toBe(201);
    expect(mocks.register).toHaveBeenCalled();
  });

  it('/login', async () => {
    mocks.login.mockImplementation((req, res) =>
      res.status(200).json({ token: 'abc' }),
    );

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@mail.com', password: '123456' });

    expect(res.status).toBe(200);
    expect(mocks.login).toHaveBeenCalled();
  });

  it('/verify-email', async () => {
    mocks.verifyEmail.mockImplementation((req, res) =>
      res.status(200).json({ verified: true }),
    );

    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: 'abc' });

    expect(res.status).toBe(200);
    expect(mocks.verifyEmail).toHaveBeenCalled();
  });

  it('/resend-verification', async () => {
    mocks.resendVerificationEmail.mockImplementation((req, res) =>
      res.status(200).json({ sent: true }),
    );

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'test@mail.com' });

    expect(res.status).toBe(200);
    expect(mocks.resendVerificationEmail).toHaveBeenCalled();
  });

  it('/forgot-password', async () => {
    mocks.forgotPassword.mockImplementation((req, res) =>
      res.status(200).json({ sent: true }),
    );

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@mail.com' });

    expect(res.status).toBe(200);
    expect(mocks.forgotPassword).toHaveBeenCalled();
  });

  it('/reset-password', async () => {
    mocks.resetPassword.mockImplementation((req, res) =>
      res.status(200).json({ reset: true }),
    );

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'abc', password: 'newpass' });

    expect(res.status).toBe(200);
    expect(mocks.resetPassword).toHaveBeenCalled();
  });

  it('/refresh-token', async () => {
    mocks.refreshToken.mockImplementation((req, res) =>
      res.status(200).json({ token: 'new-token' }),
    );

    const res = await request(app).post('/api/auth/refresh-token');

    expect(res.status).toBe(200);
    expect(mocks.refreshToken).toHaveBeenCalled();
  });

  it('/logout', async () => {
    mocks.logout.mockImplementation((req, res) =>
      res.status(200).json({ ok: true }),
    );

    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(mocks.logout).toHaveBeenCalled();
  });

  it('/logout-all', async () => {
    mocks.logoutAllDevices.mockImplementation((req, res) =>
      res.status(200).json({ ok: true }),
    );

    const res = await request(app).post('/api/auth/logout-all');

    expect(res.status).toBe(200);
    expect(mocks.logoutAllDevices).toHaveBeenCalled();
  });
});
