import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let app: any;

const mocks = {
  getAssetsByTask: vi.fn(),
  getProjectAssets: vi.fn(),
  getAssetById: vi.fn(),
  getAssetVersions: vi.fn(),
  generateDownloadUrl: vi.fn(),
  trackAssetView: vi.fn(),
  finalizeAsset: vi.fn(),
  deleteAssetSoft: vi.fn(),
};

vi.mock('../../controller/asset.controller.js', () => ({
  getAssetsByTask: mocks.getAssetsByTask,
  getProjectAssets: mocks.getProjectAssets,
  getAssetById: mocks.getAssetById,
  getAssetVersions: mocks.getAssetVersions,
  generateDownloadUrl: mocks.generateDownloadUrl,
  trackAssetView: mocks.trackAssetView,
  finalizeAsset: mocks.finalizeAsset,
  deleteAssetSoft: mocks.deleteAssetSoft,
}));

describe('Asset Routes (Supertest)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const router = (await import('../../routes/asset.routes.js')).default;

    app = express();
    app.use(express.json());
    app.use('/api/assets', router);
  });

  it('/task/:taskId', async () => {
    mocks.getAssetsByTask.mockImplementation((req, res) =>
      res.status(200).json({ ok: true }),
    );

    const res = await request(app).get('/api/assets/task/1');

    expect(res.status).toBe(200);
    expect(mocks.getAssetsByTask).toHaveBeenCalled();
  });

  it('/project/:projectId', async () => {
    mocks.getProjectAssets.mockImplementation((req, res) =>
      res.status(200).json({ ok: true }),
    );

    const res = await request(app).get('/api/assets/project/10');

    expect(res.status).toBe(200);
    expect(mocks.getProjectAssets).toHaveBeenCalled();
  });

  it('/:assetId', async () => {
    mocks.getAssetById.mockImplementation((req, res) =>
      res.status(200).json({ id: 5 }),
    );

    const res = await request(app).get('/api/assets/5');

    expect(res.status).toBe(200);
    expect(mocks.getAssetById).toHaveBeenCalled();
  });

  it('/:assetId/versions', async () => {
    mocks.getAssetVersions.mockImplementation((req, res) =>
      res.status(200).json([]),
    );

    const res = await request(app).get('/api/assets/5/versions');

    expect(res.status).toBe(200);
    expect(mocks.getAssetVersions).toHaveBeenCalled();
  });

  it('/:assetId/download', async () => {
    mocks.generateDownloadUrl.mockImplementation((req, res) =>
      res.status(200).json({ url: 'test-url' }),
    );

    const res = await request(app).get('/api/assets/5/download');

    expect(res.status).toBe(200);
    expect(mocks.generateDownloadUrl).toHaveBeenCalled();
  });

  it('/:assetId/view', async () => {
    mocks.trackAssetView.mockImplementation((req, res) =>
      res.status(200).json({ viewed: true }),
    );

    const res = await request(app).post('/api/assets/5/view');

    expect(res.status).toBe(200);
    expect(mocks.trackAssetView).toHaveBeenCalled();
  });

  it('PATCH /:assetId/finalize', async () => {
    mocks.finalizeAsset.mockImplementation((req, res) =>
      res.status(200).json({ finalized: true }),
    );

    const res = await request(app).patch('/api/assets/5/finalize');

    expect(res.status).toBe(200);
    expect(mocks.finalizeAsset).toHaveBeenCalled();
  });

  it('DELETE /:assetId', async () => {
    mocks.deleteAssetSoft.mockImplementation((req, res) =>
      res.status(204).send(),
    );

    const res = await request(app).delete('/api/assets/5');

    expect(res.status).toBe(204);
    expect(mocks.deleteAssetSoft).toHaveBeenCalled();
  });
});
