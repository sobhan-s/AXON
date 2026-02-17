import { Request, Response, NextFunction } from 'express';
import { AuthRepository, TokenService } from '@dam/common';
import { ApiError } from '@dam/utils';

const tokenService = new TokenService();
const authRepo = new AuthRepository();

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || req.cookies['access_token'];

    if (!token) {
      throw new ApiError(401, 'Access token not provided');
    }

    const payload = tokenService.verifyAccessToken(token);

    const user = await authRepo.findUserById(payload.userId);

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is deactivated');
    }

    (req as any).user = user;

    next();
  } catch (error) {
    next(error);
  }
}
