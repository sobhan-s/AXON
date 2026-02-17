import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ApiError } from '@dam/utils';
import { logger } from '@dam/config';
import { AuthRepository } from '../repository/auth.repository.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '@dam/mail';
import { ActivityPayload, ActivityService } from '@dam/common';

const repo = new AuthRepository();
const activity = new ActivityService();

export class AuthService {
  async register(data: any, ip: string) {
    logger.info('Register service started');

    const existing = await repo.findUserByEmail(data.email);
    if (existing) {
      throw new ApiError(409, 'User already exists');
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await repo.createUser({
      email: data.email,
      password: hashed,
      username: data.username,
      isEmailVerified: false,
    });

    const token = crypto.randomBytes(32).toString('hex');

    await repo.createEmailVerificationToken({
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });

    await sendVerificationEmail(user.email, token);

    const payload: ActivityPayload = {
      userId: user.id,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: user.id.toString(),
      details: {
        username: user.username,
        email: user.email,
      },
      ipAddress: ip,
    };

    activity.logActivity(payload);

    logger.info('User registered successfully', { userId: user.id });

    return { id: user.id, email: user.email };
  }

  async login(email: string, password: string) {
    logger.info('Login service started', { email });

    const user = await repo.findUserByEmail(email);
    if (!user) throw new ApiError(401, 'Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ApiError(401, 'Invalid credentials');

    if (!user.isEmailVerified) {
      throw new ApiError(403, 'Email not verified');
    }

    logger.info('Login successful', { userId: user.id });

    return { id: user.id, email: user.email };
  }

  async verifyEmail(token: string) {
    logger.info('Verifying email');

    const record = await repo.findEmailVerificationToken(token);
    if (!record || record.isUsed)
      throw new ApiError(400, 'Invalid or expired token');

    await repo.updateUser(record.userId, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    logger.info('Email verified', { userId: record.userId });
  }
}
