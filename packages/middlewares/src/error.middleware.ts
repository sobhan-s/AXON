import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@dam/utils/index';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    data: null,
    timestamp: new Date().toISOString(),
  });
};
