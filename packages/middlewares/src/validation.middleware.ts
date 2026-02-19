import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '@dam/utils';
import { logger } from '@dam/config';

export const validate =
  (schema: any) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      logger.info('VALIDATION ERROR FROM THE BODY SCHEMA');
      throw new ApiError(400, result.error.message);
    }

    req.body = result.data;
    console.log('00000000000');

    next();
  };
