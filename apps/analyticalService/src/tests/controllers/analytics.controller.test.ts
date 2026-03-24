import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockResponse } from '../helper/mockResponse.js';

let controller: any;

const mocks = {
  orgDashboard: vi.fn(),
  platformDashboard: vi.fn(),
  projectDashboard: vi.fn(),
};

vi.mock('@dam/common', () => {
  return {
    OrgDashboardService: class {
      getDashboard = mocks.orgDashboard;
    },
    PlatformDashboardService: class {
      getDashboard = mocks.platformDashboard;
    },
    ProjectDashboardService: class {
      getDashboard = mocks.projectDashboard;
    },
  };
});

// Mock parseDateRange
vi.mock('@dam/utils', async () => {
  const actual: any = await vi.importActual('@dam/utils');
  return {
    ...actual,
    parseDateRange: vi.fn(() => ({
      from: '2024-01-01',
      to: '2024-12-31',
    })),
    ApiResponse: class {
      statusCode: number;
      data: any;
      message: string;

      constructor(statusCode: number, data: any, message: string) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
      }
    },
    asyncHandler: (fn: any) => fn, // bypass wrapper
  };
});

describe('Dashboard Controller', () => {
  let req: any;
  let res: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    controller = await import('../../controller/analytics.controller.js');

    req = {
      params: {},
      query: {},
    };

    res = mockResponse();
  });

  it('should fetch organization overview', async () => {
    req.params = { orgId: '1' };

    mocks.orgDashboard.mockResolvedValue({ stats: {} });

    await controller.orgOverview(req, res, vi.fn());

    expect(mocks.orgDashboard).toHaveBeenCalledWith(1, expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // ------------------- PLATFORM OVERVIEW -------------------
  it('should fetch platform overview', async () => {
    mocks.platformDashboard.mockResolvedValue({ users: 100 });

    await controller.platformOverview(req, res, vi.fn());

    expect(mocks.platformDashboard).toHaveBeenCalledWith(expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should fetch project overview', async () => {
    req.params = { projectId: '10' };

    mocks.projectDashboard.mockResolvedValue({
      project: { id: 10 },
    });

    await controller.projectOverview(req, res, vi.fn());

    expect(mocks.projectDashboard).toHaveBeenCalledWith(10, expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 400 for invalid projectId', async () => {
    req.params = { projectId: 'abc' };

    await controller.projectOverview(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 404 if project not found', async () => {
    req.params = { projectId: '10' };

    mocks.projectDashboard.mockResolvedValue({}); // no project key

    await controller.projectOverview(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
