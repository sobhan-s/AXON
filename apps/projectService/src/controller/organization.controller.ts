import { logger } from '@dam/config';
import { asyncHandler, ApiError, ApiResponse } from '@dam/utils';
import type { RequestHandler, Request, Response } from 'express';
import { OrganizationServices } from '../services/organization.service.js';

const orgService = new OrganizationServices();

export const createOrganizations: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Organization creation controller started');

    const userId = (req as any).user?.id;
    const ip = req.ip as string;
    const { name, slug, description } = req.body;

    if (!name || !slug) {
      throw new ApiError(400, 'Name and slug are required');
    }

    logger.info('creating organization', {
      superAdminId: userId,
      orgName: name,
      orgSlug: slug,
    });

    const result = await orgService.createOrgs(userId, ip, {
      name,
      slug,
      description,
    });

    logger.info('Organization created successfully', {
      organizationId: result.organization.id,
    });

    res
      .status(201)
      .json(new ApiResponse(201, result, 'Organization created successfully'));
  },
);

export const assignAdminToOrganizations: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Assign admin to the organizations.');
    const userId = (req as any).user?.id;
    const ip = req.ip as string;
    const organizationId = Number(req.params.orgId);
    const assignEmail = req.body.adminEmail;

    logger.info('Assigning to the organizaitons . . .', {
      userId,
      assignEmail,
      organizationId,
    });

    const result = await orgService.assignAdmin(
      userId,
      organizationId,
      assignEmail,
      ip,
    );

    logger.info(
      `SuperAdmin ${userId} assign admin position to ${assignEmail}`,
      {
        organizationId: result.organization.assignedTo,
      },
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          'Assign admin in organization successfully.',
        ),
      );
  },
);
