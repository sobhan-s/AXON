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

export const updateOrganizations: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Organization updation controller has started .');

    const userId = (req as any).user?.id;
    const ip = req.ip as string;
    const userAgent = req.get('user-agent') as string;
    const organizationId = Number(req.params.orgId);

    if (!organizationId) {
      throw new ApiError(400, 'Organization Id is required . . .');
    }

    const updatedOrg = await orgService.updateOrganization(
      organizationId,
      req.body,
      userId,
      ip,
      userAgent,
    );

    logger.info('Organization updated successfully', {
      organizationId: updatedOrg.organization.id,
    });

    res
      .status(204)
      .json(
        new ApiResponse(
          204,
          updateOrganizations,
          'Organization updated successfully',
        ),
      );
  },
);

export const getAllOrganizations: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('getAll Organization Controller has been started . . .');
    const userId = (req as any).user?.id as number;

    const result = await orgService.getAllOrganizations(userId);

    logger.info('fetched All organization successfully', {
      result,
    });

    res
      .status(200)
      .json(new ApiResponse(200, result, 'Organization fetched Successfully'));
  },
);

export const getOrganizationById: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('get organization by id controller started . . .');
    const organizationId = Number(req.params.orgId);

    const result = await orgService.getOrganizationById(organizationId);

    logger.info('fetched organization successfully.', {
      result,
    });

    res
      .status(200)
      .json(new ApiResponse(200, result, 'Organization fetched Successfully'));
  },
);

export const deleteOrganization: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Delete organisations stated ');

    const orgId = Number(req.params.orgId);
    const userId = (req as any).user?.id;
    const ip = req.ip as string;
    const userAgent = req.get('user-agent') as string;

    const result = await orgService.deleteOrganization(
      userId,
      orgId,
      ip,
      userAgent,
    );

    res
      .status(204)
      .json(new ApiResponse(204, result, 'Organization deleted successfully.'));
  },
);

export const unAssignFromOrganization: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Unassign from the org');

    const orgId = Number(req.params.orgId);
    const userId = (req as any).user?.id;

    const result = await orgService.unAssignFromOrganization(userId, orgId);

    logger.info('unassign admin from this orgs successfully.');

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          'super admin unassign the organization admin successfully',
        ),
      );
  },
);

export const changeStatus: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('changes status of organizatino called in controller');

    const organisationsId = Number(req.params.orgId);
    const status = req.body;
    const ip = req.ip as string;
    const userAgent = req.get('user-agent') as string;

    const result = await orgService.changeStautus(
      organisationsId,
      status,
      ip,
      userAgent,
    );

    logger.info('Organization status changed successfully');

    res
      .status(204)
      .json(
        new ApiResponse(
          204,
          result,
          'Organization status changed successfully',
        ),
      );
  },
);
