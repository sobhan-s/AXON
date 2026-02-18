import { logger } from '@dam/config';
import { asyncHandler, ApiError, ApiResponse } from '@dam/utils';
import type { RequestHandler, Request, Response } from 'express';
import { OrganizationServices } from '../services/organization.service.js';

const orgService = new OrganizationServices();

const createOrganizations: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('start creaing organization controllers . . .');

    const ip = req.ip as string;
    const userId = (req as any).user?.id;
    const result = orgService.createOrgs(userId, ip, req.body);

    logger.info('Organization creations controller successfully');

    res
      .status(201)
      .json(
        new ApiResponse(201, result, 'Organization Created Successfully .'),
      );
  },
);

export { createOrganizations };
