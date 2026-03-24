import { describe, it, expect, vi, beforeEach } from 'vitest';

let AssetService: any;

const repoMocks = {
  getByTask: vi.fn(),
  getByProject: vi.fn(),
  getById: vi.fn(),
  getVersionHistory: vi.fn(),
  getDownloadUrl: vi.fn(),
  trackView: vi.fn(),
  finalize: vi.fn(),
  softDelete: vi.fn(),
};

vi.mock('@dam/repository', () => {
  return {
    AssetRepository: class {
      getByTask = repoMocks.getByTask;
      getByProject = repoMocks.getByProject;
      getById = repoMocks.getById;
      getVersionHistory = repoMocks.getVersionHistory;
      getDownloadUrl = repoMocks.getDownloadUrl;
      trackView = repoMocks.trackView;
      finalize = repoMocks.finalize;
      softDelete = repoMocks.softDelete;
    },
  };
});

describe('AssetService', () => {
  let service: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const module = await import('../../service/asset.service.js');
    AssetService = module.AssetService;

    service = new AssetService();
  });

  it('should fetch assets by task', async () => {
    repoMocks.getByTask.mockResolvedValue([{ id: 1 }]);

    const result = await service.getAssetsByTask(10);

    expect(repoMocks.getByTask).toHaveBeenCalledWith(10);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('should fetch project assets with filters', async () => {
    repoMocks.getByProject.mockResolvedValue([{ id: 1 }]);

    const result = await service.getByProjects(5, 'image', 'ACTIVE', 'true');

    expect(repoMocks.getByProject).toHaveBeenCalledWith(5, {
      fileType: 'image',
      status: 'ACTIVE',
      isFinal: true,
    });

    expect(result).toEqual([{ id: 1 }]);
  });

  it('should fetch asset by id', async () => {
    repoMocks.getById.mockResolvedValue({ id: 'abc' });

    const result = await service.getAssetById('abc');

    expect(repoMocks.getById).toHaveBeenCalledWith('abc');
    expect(result).toEqual({ id: 'abc' });
  });

  it('should fetch version history', async () => {
    repoMocks.getVersionHistory.mockResolvedValue([{ version: 1 }]);

    const result = await service.getVersionHistory('abc');

    expect(repoMocks.getVersionHistory).toHaveBeenCalledWith('abc');
    expect(result).toEqual([{ version: 1 }]);
  });

  it('should generate download url', async () => {
    repoMocks.getDownloadUrl.mockResolvedValue({ url: 'signed-url' });

    const result = await service.getDownloadUrl('abc', 3600);

    expect(repoMocks.getDownloadUrl).toHaveBeenCalledWith('abc', 3600);
    expect(result).toEqual({ url: 'signed-url' });
  });

  it('should track asset view', async () => {
    repoMocks.trackView.mockResolvedValue({ viewed: true });

    const result = await service.viewUrl('abc');

    expect(repoMocks.trackView).toHaveBeenCalledWith('abc');
    expect(result).toEqual({ viewed: true });
  });

  it('should finalize asset', async () => {
    repoMocks.finalize.mockResolvedValue({ status: 'FINAL' });

    const result = await service.finalizeImage('abc');

    expect(repoMocks.finalize).toHaveBeenCalledWith('abc');
    expect(result).toEqual({ status: 'FINAL' });
  });

  it('should soft delete asset', async () => {
    repoMocks.softDelete.mockResolvedValue(true);

    const result = await service.deleteImageSoft('abc');

    expect(repoMocks.softDelete).toHaveBeenCalledWith('abc');
    expect(result).toBe(true);
  });
});
