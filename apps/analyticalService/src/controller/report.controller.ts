import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ReportService } from '@dam/common';
import { ApiResponse, asyncHandler, parseDateRange } from '@dam/utils';

const reportService = new ReportService();

export const generatePlatformReport: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    const range = parseDateRange(req);
    const requestedBy = Number(req.user?.id);

    const data = await reportService.generatePlatformReport({
      range,
      requestedBy,
      email,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          data,
          'Platform report generated successfully and send to the user mail',
        ),
      );
  },
);

export const generateOrgReport: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const orgId = Number(req.params.orgId);
    const { email } = req.body;
    const range = parseDateRange(req);
    const requestedBy = Number(req.user?.id);

    const data = await reportService.generateOrgReport(orgId, {
      range,
      requestedBy,
      email,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          data,
          'Organization report generated successfully and sent to the user email',
        ),
      );
  },
);

export const generateProjectReport: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = Number(req.params.projectId);
    const { email } = req.body;
    const range = parseDateRange(req);
    const requestedBy = Number(req.user?.id);

    const data = await reportService.generateProjectReport(projectId, {
      range,
      requestedBy,
      email,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          data,
          'Project report generated successfully and sent to the user email',
        ),
      );
  },
);
