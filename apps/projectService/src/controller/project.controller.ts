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

export const getAllProjects: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('start fetching all project of organization ');
    const organizationId = Number(req.params.orgId);

    const result = await projectService.getAllProjects(organizationId);

    logger.info('All project fethced successfully .');

    res
      .status(200)
      .json(new ApiResponse(200, result, 'Projects retrieved successfully'));
  },
);

export const getMyProjects: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('get my project controller has stated');
    const userId = (req as any).user?.id;

    const result = await projectService.getUserProjects(userId);

    logger.info('get my projects fethced successfully . ');

    res
      .status(200)
      .json(
        new ApiResponse(200, result, 'Your projects retrieved successfully'),
      );
  },
);

export const getProjectById: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = Number(req.params.projectId);

    const result = await projectService.getProjectById(projectId);

    res.json(new ApiResponse(200, result, 'Project retrieved successfully'));
  },
);

export const updateProject: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('update project controller has been stated');
    const userId = (req as any).user?.id;
    const projectId = Number(req.params.projectId);

    const result = await projectService.updateProject(
      projectId,
      userId,
      req.body,
    );

    res.json(new ApiResponse(200, result, 'Project updated successfully'));
  },
);

export const addManager: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Adding a manager to the project has been stated');

    const userId = (req as any).user?.id;
    const targetUserId = req.body.targetUserId;
    const projectId = Number(req.params.projectId);
    const organizationId = Number(req.params.orgId);
    const ip = req.ip!;
    const userAgent = req.get('user-agent')!;

    const result = await projectService.assignManagerToProject(
      projectId,
      organizationId,
      targetUserId,
      userId,
      ip,
      userAgent,
    );

    logger.info('adding a manager to the project successfully completed');

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          'adding a manager to the project successfully completed',
        ),
      );
  },
);

export const archiveProject: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const projectId = Number(req.params.projectId);

    const result = await projectService.archiveProject(projectId, userId);

    res.json(new ApiResponse(200, result, 'Project archived successfully'));
  },
);

export const deleteProject: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const projectId = Number(req.params.projectId);

    const result = await projectService.deleteProject(projectId, userId);

    res.json(new ApiResponse(200, result, 'Project deleted successfully'));
  },
);

export const addTeamMember: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Adding team member controlle has been statend ');
    const userId = (req as any).user?.id;
    const projectId = Number(req.params.projectId);
    const targetUserId = req.body.targetUserId;

    const result = await projectService.addTeamMember(
      projectId,
      userId,
      targetUserId,
    );

    res
      .status(201)
      .json(new ApiResponse(201, result, 'Team member added successfully'));
  },
);

export const removeTeamMember: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const projectId = Number(req.params.projectId);
    const { userId: targetUserId } = req.body;

    const result = await projectService.removeTeamMember(
      projectId,
      userId,
      targetUserId,
    );

    res.json(new ApiResponse(200, result, 'Team member removed successfully'));
  },
);

export const getTeamMembers: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = Number(req.params.projectId);

    const result = await projectService.getTeamMembers(projectId);

    res.json(
      new ApiResponse(200, result, 'Team members retrieved successfully'),
    );
  },
);
