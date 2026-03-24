import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let app: any;

const mocks = {
  orgDashboard: vi.fn(),
  platformDashboard: vi.fn(),
  projectDashboard: vi.fn(),
  generatePlatformReport: vi.fn(),
  generateOrgReport: vi.fn(),
  generateProjectReport: vi.fn(),
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
    ReportService: class {
      generatePlatformReport = mocks.generatePlatformReport;
      generateOrgReport = mocks.generateOrgReport;
      generateProjectReport = mocks.generateProjectReport;
    },
  };
});

// ---------------- MOCK UTILS ----------------
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

vi.mock('@dam/middlewares', () => {
  return {
    authMiddleware: (req: any, _res: any, next: any) => {
      req.user = { id: 1 }; // inject fake user
      next();
    },
  };
});

describe('Analytics + Report Routes (Supertest)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const router = (await import('../../routes/analytics.routes.js')).default;

    app = express();
    app.use(express.json());
    app.use('/api', router);
  });

  it('GET /api/org/overview/:orgId', async () => {
    mocks.orgDashboard.mockResolvedValue({ stats: {} });

    const res = await request(app).get('/api/org/overview/1');

    expect(res.status).toBe(200);
    expect(mocks.orgDashboard).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('GET /api/platform/overview', async () => {
    mocks.platformDashboard.mockResolvedValue({ users: 100 });

    const res = await request(app).get('/api/platform/overview');

    expect(res.status).toBe(200);
    expect(mocks.platformDashboard).toHaveBeenCalled();
  });

  it('GET /api/project/:projectId/overview', async () => {
    mocks.projectDashboard.mockResolvedValue({
      project: { id: 10 },
    });

    const res = await request(app).get('/api/project/10/overview');

    expect(res.status).toBe(200);
    expect(mocks.projectDashboard).toHaveBeenCalledWith(10, expect.any(Object));
  });

  it('POST /api/report/platform', async () => {
    mocks.generatePlatformReport.mockResolvedValue({ success: true });

    const res = await request(app)
      .post('/api/report/platform')
      .send({ email: 'test@mail.com' });

    expect(res.status).toBe(200);
    expect(mocks.generatePlatformReport).toHaveBeenCalled();
  });

  // ---------------- ORG REPORT ----------------
  it('POST /api/report/org/:orgId', async () => {
    mocks.generateOrgReport.mockResolvedValue({ success: true });

    const res = await request(app)
      .post('/api/report/org/5')
      .send({ email: 'org@mail.com' });

    expect(res.status).toBe(200);
    expect(mocks.generateOrgReport).toHaveBeenCalledWith(5, expect.any(Object));
  });

  it('POST /api/report/project/:projectId', async () => {
    mocks.generateProjectReport.mockResolvedValue({ success: true });

    const res = await request(app)
      .post('/api/report/project/10')
      .send({ email: 'project@mail.com' });

    expect(res.status).toBe(200);
    expect(mocks.generateProjectReport).toHaveBeenCalledWith(
      10,
      expect.any(Object),
    );
  });
});
