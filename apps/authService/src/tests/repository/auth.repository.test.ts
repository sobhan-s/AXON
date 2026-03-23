import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostgresClient as prisma } from '@dam/postgresql_db';

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },

  emailVerificationToken: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },

  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },

  passwordResetToken: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@dam/postgresql_db', () => ({
  PostgresClient: prismaMock,
}));

import { AuthRepository } from '@dam/repository';

describe('AuthRepository', () => {
  let repo: AuthRepository;

  beforeEach(() => {
    repo = new AuthRepository();
    vi.clearAllMocks();
  });

  it('should find user by email', async () => {
    const user = { id: 1, email: 'test@test.com' };

    prismaMock.user.findUnique.mockResolvedValue(user);

    const result = await repo.findUserByEmail('test@test.com');

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@test.com' },
    });

    expect(result).toEqual(user);
  });

  it('should find user by id', async () => {
    const user = { id: 1 };

    prismaMock.user.findUnique.mockResolvedValue(user);

    const result = await repo.findUserById(1);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });

    expect(result).toEqual(user);
  });

  it('should create user', async () => {
    const data = {
      email: 'test@test.com',
      password: 'hashed',
      username: 'test',
    };

    prismaMock.user.create.mockResolvedValue({ id: 1, ...data });

    const result = await repo.createUser(data);

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data,
    });

    expect(result.id).toBe(1);
  });

  it('should update user', async () => {
    prismaMock.user.update.mockResolvedValue({ id: 1 });

    const result = await repo.updateUser(1, { isActive: true });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isActive: true },
    });

    expect(result).toEqual({ id: 1 });
  });

  it('should create email verification token', async () => {
    const data = {
      token: 'token123',
      userId: 1,
      expiresAt: new Date(),
    };

    prismaMock.emailVerificationToken.create.mockResolvedValue(data);

    await repo.createEmailVerificationToken(data);

    expect(prismaMock.emailVerificationToken.deleteMany).toHaveBeenCalled();

    expect(prismaMock.emailVerificationToken.create).toHaveBeenCalledWith({
      data,
    });
  });

  it('should find email verification token', async () => {
    prismaMock.emailVerificationToken.findUnique.mockResolvedValue({
      token: 'abc',
    });

    const result = await repo.findEmailVerificationToken('abc');

    expect(prismaMock.emailVerificationToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'abc' },
      include: { user: true },
    });

    expect(result).toEqual({ token: 'abc' });
  });

  it('should revoke refresh token', async () => {
    prismaMock.refreshToken.update.mockResolvedValue({ token: 'abc' });

    const result = await repo.revokeRefreshToken('abc');

    expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
      where: { token: 'abc' },
      data: { revoked: true },
    });

    expect(result.token).toBe('abc');
  });

  it('should revoke all user refresh tokens', async () => {
    prismaMock.refreshToken.updateMany.mockResolvedValue({ count: 3 });

    const result = await repo.revokeAllUserRefreshTokens(1);

    expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 1,
        revoked: false,
      },
      data: { revoked: true },
    });

    expect(result.count).toBe(3);
  });

  it('should create password reset token', async () => {
    const data = {
      token: 'reset',
      userId: 1,
      expiresAt: new Date(),
    };

    prismaMock.passwordResetToken.create.mockResolvedValue(data);

    await repo.createPasswordResetToken(data);

    expect(prismaMock.passwordResetToken.deleteMany).toHaveBeenCalled();

    expect(prismaMock.passwordResetToken.create).toHaveBeenCalledWith({
      data,
    });
  });

  it('should find password reset token', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue({
      token: 'reset',
    });

    const result = await repo.findPasswordResetToken('reset');

    expect(prismaMock.passwordResetToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'reset' },
      include: { user: true },
    });

    expect(result!.token).toBe('reset');
  });
});
