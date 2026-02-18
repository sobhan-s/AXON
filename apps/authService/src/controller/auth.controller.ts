import { asyncHandler, ApiResponse, ApiError } from '@dam/utils';
import { AuthService } from '../services/auth.service.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} from '@dam/validations';
import { env_config_variable, logger } from '@dam/config';
import type { RequestHandler, Request, Response } from 'express';
import { CONSTANTS } from '@dam/constants';

const service = new AuthService();

// const REFRESH_TOKEN_COOKIE = 'refresh_token';
// const ACCESS_TOKEN_COOKIE = 'access_token';

const cookieOptions = {
  httpOnly: true,
  secure: env_config_variable.ENVIORMENT.PROD === 'production',
  // sameSite: 'strict' as const,
};

const refreshTokenCookieOptions = {
  ...cookieOptions,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const accessTokenCookieOptions = {
  ...cookieOptions,
  maxAge: 20 * 60 * 1000,
};

export const register: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.message);
    }

    const ip = req.ip as string;
    const result = await service.register(parsed.data, ip);

    logger.info('Register controller success');

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          result,
          'Registration successful. Please check your email to verify your account.',
        ),
      );
  },
);

export const login: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.message);
    }

    const ip = req.ip as string;
    const userAgent = req.get('user-agent');

    const result = await service.login(
      parsed.data.email,
      parsed.data.password,
      ip,
      userAgent,
    );

    res
      .cookie(
        CONSTANTS.TOKEN_NAME.ACCESS_TOKEN_COOKIE,
        result.accessToken,
        accessTokenCookieOptions,
      )
      .cookie(
        CONSTANTS.TOKEN_NAME.REFRESH_TOKEN_COOKIE,
        result.refreshToken,
        refreshTokenCookieOptions,
      )
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            user: result.user,
            accessToken: result.accessToken,
          },
          'Login successful',
        ),
      );
  },
);

export const verifyEmail: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = verifyEmailSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.message);
    }

    await service.verifyEmail(parsed.data.token);

    res
      .status(200)
      .json(new ApiResponse(200, null, 'Email verified successfully'));
  },
);

export const refreshToken: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const token =
      req.cookies[CONSTANTS.TOKEN_NAME.REFRESH_TOKEN_COOKIE] ||
      req.body.refreshToken;

    if (!token) {
      throw new ApiError(401, 'Refresh token not provided');
    }

    const result = await service.refreshToken(token);

    res
      .cookie(
        CONSTANTS.TOKEN_NAME.ACCESS_TOKEN_COOKIE,
        result.accessToken,
        accessTokenCookieOptions,
      )
      .cookie(
        CONSTANTS.TOKEN_NAME.REFRESH_TOKEN_COOKIE,
        result.refreshToken,
        refreshTokenCookieOptions,
      )
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken: result.accessToken },
          'Tokens refreshed successfully',
        ),
      );
  },
);

export const logout: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const token =
      req.cookies[CONSTANTS.TOKEN_NAME.REFRESH_TOKEN_COOKIE] ||
      req.body.refreshToken;

    if (!token) {
      throw new ApiError(401, 'Refresh token not provided');
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    await service.logout(token, userId);

    res
      .clearCookie(CONSTANTS.TOKEN_NAME.ACCESS_TOKEN_COOKIE, cookieOptions)
      .clearCookie(CONSTANTS.TOKEN_NAME.REFRESH_TOKEN_COOKIE, cookieOptions)
      .status(200)
      .json(new ApiResponse(200, null, 'Logged out successfully'));
  },
);

export const logoutAllDevices: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    await service.logoutAllDevices(userId);

    res
      .clearCookie(CONSTANTS.TOKEN_NAME.ACCESS_TOKEN_COOKIE, cookieOptions)
      .clearCookie(CONSTANTS.TOKEN_NAME.REFRESH_TOKEN_COOKIE, cookieOptions)
      .status(200)
      .json(
        new ApiResponse(200, null, 'Logged out from all devices successfully'),
      );
  },
);

export const forgotPassword: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.message);
    }

    await service.forgotPassword(parsed.data.email);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          'If an account exists with this email, you will receive a password reset link.',
        ),
      );
  },
);

export const resetPassword: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const queryData = req.query.token as string;

    console.log('===', queryData, req.body.newPassword);

    const parsed = resetPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.message);
    }

    await service.resetPassword(queryData, parsed.data.newPassword);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          'Password reset successfully. Please login with your new password.',
        ),
      );
  },
);

export const resendVerificationEmail: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = resendVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.message);
    }

    await service.resendVerificationEmail(parsed.data.email);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          'If your email is registered and unverified, you will receive a verification email.',
        ),
      );
  },
);
