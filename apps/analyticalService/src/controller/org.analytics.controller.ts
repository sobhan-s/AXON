import { ApiResponse, asyncHandler, parseDateRange } from '@dam/utils';
import { Request, RequestHandler, Response } from 'express';
import { orgAnalyticsService } from '../service/orgAnalytics.service.js';

export const orgOverview: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const orgId = Number(req.params.orgId);
    const range = parseDateRange(req);
    const result = await orgAnalyticsService.getOverview(orgId, range);

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

export const orgStorage: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const orgId = Number(req.params.orgId);
    const range = parseDateRange(req);
    const result = await orgAnalyticsService.getStorage(orgId, range);

    res
      .status(200)
      .json(
        new ApiResponse(200, result, 'Orgstorage data fetched successfully'),
      );
  },
);

export const orgUsers: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const orgId = Number(req.params.orgId);
    const range = parseDateRange(req);
    const data = await orgAnalyticsService.getUsers(orgId, range);

    res
      .status(200)
      .json(new ApiResponse(200, data, 'OrgUser fetched successfully'));
  },
);

export const orgActivity: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const orgId = Number(req.params.orgId);
    const range = parseDateRange(req);
    const data = await orgAnalyticsService.getActivity(orgId, range);

    res
      .status(200)
      .json(new ApiResponse(200, data, 'orgActivity fetched successfully.'));
  },
);
