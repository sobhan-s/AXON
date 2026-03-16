import { ApiResponse, asyncHandler, parseDateRange } from '@dam/utils';
import { Request, RequestHandler, Response } from 'express';
import {
  OrgDashboardService,
  PlatformDashboardService,
  ProjectDashboardService,
} from '@dam/common';

const orgService = new OrgDashboardService();
const platformService = new PlatformDashboardService();
const projectService = new ProjectDashboardService();

export const orgOverview: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const orgId = Number(req.params.orgId);
    const range = parseDateRange(req);
    const result = await orgService.getDashboard(orgId, range);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          'organization overview fetched successfully',
        ),
      );
  },
);

export const platformOverview: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const range = parseDateRange(req);
    const result = await platformService.getDashboard(range);

    res
      .status(200)
      .json(new ApiResponse(200, result, 'Platform data fetched successfully'));
  },
);

export const projectOverview: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = Number(req.params.projectId);
    const range = parseDateRange(req);

    if (isNaN(projectId)) {
      return res.status(400).json({ message: 'Invalid projectId' });
    }

    const data = await projectService.getDashboard(projectId, range);

    if (!(data as any)?.project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res
      .status(200)
      .json(new ApiResponse(200, data, 'Pronect data feteched successfully'));
  },
);
