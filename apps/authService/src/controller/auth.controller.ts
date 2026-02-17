import { asyncHandler, ApiResponse } from '@dam/utils';
import { AuthService } from '../services/auth.services.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
} from '@dam/validations';
import { ApiError } from '@dam/utils';
import { logger } from '@dam/config';
import type { RequestHandler } from 'express';
import type { Request, Response } from 'express';

const service = new AuthService();

export const register: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    const ip = req.ip as string;
    if (!parsed.success) throw new ApiError(400, parsed.error.message);

    const result = await service.register(parsed.data, ip);

    logger.info('Register controller success');

    res
      .status(201)
      .json(new ApiResponse(201, result, 'User registered successfully'));
  },
);

export const login: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, parsed.error.message);

    const result = await service.login(parsed.data.email, parsed.data.password);

    res.status(200).json(new ApiResponse(200, result, 'Login successful'));
  },
);

export const verifyEmail: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = verifyEmailSchema.safeParse(req.query);
    if (!parsed.success) throw new ApiError(400, parsed.error.message);

    await service.verifyEmail(parsed.data.token);

    res
      .status(200)
      .json(new ApiResponse(200, null, 'Email verified successfully'));
  },
);
