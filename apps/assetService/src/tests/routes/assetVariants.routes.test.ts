import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let app: any;

const mocks = {
  getVariants: vi.fn(),
  requestVariants: vi.fn(),
  getVariantDownloadUrl: vi.fn(),
};

 vi.mock('../../controller/assetVariants.controller.js', () => ({
  getVariants: mocks.getVariants,
  requestVariants: mocks.requestVariants,
  getVariantDownloadUrl: mocks.getVariantDownloadUrl,
}));

 vi.mock('@dam/middlewares', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: 1 }; // inject fake user
    next();
  },
}));

describe('Asset Variants Routes (Supertest)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const router = (await import('../../routes/assetVariant.routes.js')).default;

    app = express();
    app.use(express.json());
    app.use('/api/variants', router);
  });

   it('/:assetId/variants', async () => {
    mocks.getVariants.mockImplementation((req, res) =>
      res.status(200).json({ variants: [] }),
    );

    const res = await request(app).get('/api/variants/10/variants');

    expect(res.status).toBe(200);
    expect(mocks.getVariants).toHaveBeenCalled();
  });

   it('/:assetId/variants', async () => {
    mocks.requestVariants.mockImplementation((req, res) =>
      res.status(201).json({ requested: true }),
    );

    const res = await request(app)
      .post('/api/variants/10/variants')
      .send({ type: 'thumbnail' });

    expect(res.status).toBe(201);
    expect(mocks.requestVariants).toHaveBeenCalled();
  });

   it('/:variantId/download', async () => {
    mocks.getVariantDownloadUrl.mockImplementation((req, res) =>
      res.status(200).json({ url: 'download-link' }),
    );

    const res = await request(app).get('/api/variants/5/download');

    expect(res.status).toBe(200);
    expect(mocks.getVariantDownloadUrl).toHaveBeenCalled();
  });
});