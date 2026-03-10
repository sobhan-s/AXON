import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ApiError } from '@dam/utils';
import { env_config_variable } from '@dam/config';

export interface AccessTokenPayload {
  userId: number;
  email: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: number;
  type: 'refresh';
}

export class TokenService {
  constructor() {
    if (
      !env_config_variable.TOKEN.ACCESS_TOKEN ||
      !env_config_variable.TOKEN.REFRESH_TOKEN
    ) {
      throw new Error('Token secrets not configured');
    }
  }

  generateAccessToken(payload: any): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      env_config_variable.TOKEN.ACCESS_TOKEN!,
      {
        expiresIn: '20m',
      },
    );
  }

  generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(
      { ...payload, type: 'refresh' },
      env_config_variable.TOKEN.REFRESH_TOKEN!,
      {
        expiresIn: '30d',
      },
    );
  }

  generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(
        token,
        env_config_variable.TOKEN.ACCESS_TOKEN!,
      ) as AccessTokenPayload;

      if (payload.type !== 'access') {
        throw new ApiError(401, 'Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, 'Access token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, 'Invalid access token');
      }
      throw error;
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const payload = jwt.verify(
        token,
        env_config_variable.TOKEN.REFRESH_TOKEN!,
      ) as RefreshTokenPayload;

      if (payload.type !== 'refresh') {
        throw new ApiError(401, 'Invalid token type');
      }

      console.log('asdhfasdhfiashdfiahsdiuhsadifh', payload);

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, 'Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, 'Invalid refresh token');
      }
      throw error;
    }
  }

  getRefreshTokenExpiryDate(): Date {
    const days =
      parseInt(env_config_variable.TOKEN.REFRESH_TOKEN_EXPIRY!) || 30;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
  }

  getEmailVerificationTokenExpiryDate(): Date {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    return expiry;
  }

  getPasswordResetTokenExpiryDate(): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 30);
    return expiry;
  }
}
