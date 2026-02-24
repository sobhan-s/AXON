import { logger } from '@dam/config';
import { asyncHandler, ApiError, ApiResponse } from '@dam/utils';
import type { RequestHandler, Request, Response } from 'express';
import { ProjectServices } from '../services/project.service.js';

const projectService = new ProjectServices();

export const createProject: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Creation of project in controller called  . . .');

    const ip = req.ip as string;
    const userAgent = req.get('user-agent') as string;
    const organizationId = Number(req.params.orgId);
    const userId = (req as any).user?.id;

    const result = await projectService.createProjects(
      userId,
      organizationId,
      ip,
      userAgent,
      req.body,
    );

    logger.info('Createion of Project successfully');

    res
      .status(201)
      .json(new ApiResponse(201, result, 'Proect Created Successfully'));
  },
);
