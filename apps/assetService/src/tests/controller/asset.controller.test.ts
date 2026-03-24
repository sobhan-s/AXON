import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockResponse } from '../helper/mockResponse.js';

let controller: any;

const mocks = {
  getAssetsByTask: vi.fn(),
  getByProjects: vi.fn(),
  getAssetById: vi.fn(),
  getVersionHistory: vi.fn(),
  getDownloadUrl: vi.fn(),
  viewUrl: vi.fn(),
  finalizeImage: vi.fn(),
  deleteImageSoft: vi.fn(),
};

vi.mock('../../service/asset.service.js', () => {
  return {
    AssetService: class {
      getAssetsByTask = mocks.getAssetsByTask;
      getByProjects = mocks.getByProjects;
      getAssetById = mocks.getAssetById;
      getVersionHistory = mocks.getVersionHistory;
      getDownloadUrl = mocks.getDownloadUrl;
      viewUrl = mocks.viewUrl;
      finalizeImage = mocks.finalizeImage;
      deleteImageSoft = mocks.deleteImageSoft;
    },
  };
});

describe('Asset Controller', () => {
  let req: any;
  let res: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    controller = await import('../../controller/asset.controller.js');

    req = {
      params: {},
      query: {},
      body: {},
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      get: vi.fn().mockReturnValue('test-agent'),
      header: vi.fn().mockReturnValue('test-agent'),
    };

    res = mockResponse();
  });

  it('should fetch assets by task', async () => {
    req.params = { taskId: '1' };

    mocks.getAssetsByTask.mockResolvedValue([{ id: 'asset1' }]);

    await controller.getAssetsByTask(req, res, vi.fn());

    expect(mocks.getAssetsByTask).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalled();
  });

  it('should fetch project assets', async () => {
    req.params = { projectId: '1' };
    req.query = { fileType: 'image', status: 'approved', isFinal: 'true' };

    mocks.getByProjects.mockResolvedValue([{ id: 'asset1' }]);

    await controller.getProjectAssets(req, res, vi.fn());

    expect(mocks.getByProjects).toHaveBeenCalledWith(
      1,
      'image',
      'approved',
      'true',
    );

    expect(res.json).toHaveBeenCalled();
  });

  it('should fetch asset by id', async () => {
    req.params = { assetId: 'abc123' };

    mocks.getAssetById.mockResolvedValue({ id: 'abc123' });

    await controller.getAssetById(req, res, vi.fn());

    expect(mocks.getAssetById).toHaveBeenCalledWith('abc123');
    expect(res.json).toHaveBeenCalled();
  });

  it('should fetch asset versions', async () => {
    req.params = { assetId: 'abc123' };

    mocks.getVersionHistory.mockResolvedValue([]);

    await controller.getAssetVersions(req, res, vi.fn());

    expect(mocks.getVersionHistory).toHaveBeenCalledWith('abc123');
    expect(res.json).toHaveBeenCalled();
  });

  it('should generate download url', async () => {
    req.params = { assetId: 'abc123' };
    req.query = { expiry: '7200' };

    mocks.getDownloadUrl.mockResolvedValue({ url: 'download-url' });

    await controller.generateDownloadUrl(req, res, vi.fn());

    expect(mocks.getDownloadUrl).toHaveBeenCalledWith('abc123', 7200);
    expect(res.json).toHaveBeenCalled();
  });

  it('should track asset view', async () => {
    req.params = { assetId: 'abc123' };

    mocks.viewUrl.mockResolvedValue({ id: 'abc123' });

    await controller.trackAssetView(req, res, vi.fn());

    expect(mocks.viewUrl).toHaveBeenCalledWith('abc123');
    expect(res.json).toHaveBeenCalled();
  });

  it('should finalize asset', async () => {
    req.params = { assetId: 'abc123' };

    mocks.finalizeImage.mockResolvedValue({ id: 'abc123' });

    await controller.finalizeAsset(req, res, vi.fn());

    expect(mocks.finalizeImage).toHaveBeenCalledWith('abc123');
    expect(res.json).toHaveBeenCalled();
  });

  it('should soft delete asset', async () => {
    req.params = { assetId: 'abc123' };

    mocks.deleteImageSoft.mockResolvedValue(undefined);

    await controller.deleteAssetSoft(req, res, vi.fn());

    expect(mocks.deleteImageSoft).toHaveBeenCalledWith('abc123');
    expect(res.json).toHaveBeenCalled();
  });
});
