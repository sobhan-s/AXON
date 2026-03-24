import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockResponse } from '../helper/mockResponse.js';

let controller: any;

const mocks = {
  generatePlatformReport: vi.fn(),
  generateOrgReport: vi.fn(),
  generateProjectReport: vi.fn(),
};

vi.mock('@dam/common', () => {
  return {
    ReportService: class {
      generatePlatformReport = mocks.generatePlatformReport;
      generateOrgReport = mocks.generateOrgReport;
      generateProjectReport = mocks.generateProjectReport;
    },
  };
});

// Mock utils
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
    asyncHandler: (fn: any) => fn,
  };
});

describe('Report Controller', () => {
  let req: any;
  let res: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    controller = await import('../../controller/report.controller.js');

    req = {
      params: {},
      body: {},
      query: {},
      user: { id: 1 },
    };

    res = mockResponse();
  });

   it('should generate platform report', async () => {
    req.body = { email: 'test@mail.com' };

    mocks.generatePlatformReport.mockResolvedValue({ success: true });

    await controller.generatePlatformReport(req, res, vi.fn());

    expect(mocks.generatePlatformReport).toHaveBeenCalledWith({
      range: expect.any(Object),
      requestedBy: 1,
      email: 'test@mail.com',
    });

    expect(res.status).toHaveBeenCalledWith(200);
  });

   it('should generate org report', async () => {
    req.params = { orgId: '5' };
    req.body = { email: 'org@mail.com' };

    mocks.generateOrgReport.mockResolvedValue({ success: true });

    await controller.generateOrgReport(req, res, vi.fn());

    expect(mocks.generateOrgReport).toHaveBeenCalledWith(5, {
      range: expect.any(Object),
      requestedBy: 1,
      email: 'org@mail.com',
    });

    expect(res.status).toHaveBeenCalledWith(200);
  });

   it('should generate project report', async () => {
    req.params = { projectId: '10' };
    req.body = { email: 'project@mail.com' };

    mocks.generateProjectReport.mockResolvedValue({ success: true });

    await controller.generateProjectReport(req, res, vi.fn());

    expect(mocks.generateProjectReport).toHaveBeenCalledWith(10, {
      range: expect.any(Object),
      requestedBy: 1,
      email: 'project@mail.com',
    });

    expect(res.status).toHaveBeenCalledWith(200);
  });
});