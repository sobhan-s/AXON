import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockResponse } from '../helper/mockResponse.js';

let controller: any;

const mocks = {
  queueAssetProcessing: vi.fn(),
  getVarinats: vi.fn(),
  getVariantDownloadUrl: vi.fn(),
};

vi.mock('../../service/VariantQueue.service.js', () => {
  return {
    queueAssetProcessing: mocks.queueAssetProcessing,
  };
});

vi.mock('../../service/assetVariant.service.js', () => {
  return {
    AssetVariantService: class {
      getVarinats = mocks.getVarinats;
      getVariantDownloadUrl = mocks.getVariantDownloadUrl;
    },
  };
});

describe('Asset Variant Controller', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    controller = await import(
      '../../controller/assetVariants.controller.js'
    );

    req = {
      params: {},
      body: {},
    };

    res = mockResponse();
    next = vi.fn();
  });

  it('should queue asset variants', async () => {
    req.params = { assetId: '1' };
    req.body = { variants: ['thumbnail', 'medium'] };

    mocks.queueAssetProcessing.mockResolvedValue({
      queued: ['thumbnail'],
      alreadyExist: ['medium'],
    });

    await controller.requestVariants(req, res, next);

    expect(mocks.queueAssetProcessing).toHaveBeenCalledWith('1', [
      'thumbnail',
      'medium',
    ]);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it('should return 400 if variants array missing', async () => {
    req.params = { assetId: '1' };
    req.body = {};

    await controller.requestVariants(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fetch asset variants', async () => {
    req.params = { assetId: '1' };

    mocks.getVarinats.mockResolvedValue({
      asset: {
        processingStatus: 'COMPLETED',
        processingError: null,
      },
      variants: [{ id: 1 }],
    });

    await controller.getVariants(req, res, next);

    expect(mocks.getVarinats).toHaveBeenCalledWith('1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it('should fetch variant download url', async () => {
    req.params = { variantId: '5' };

    mocks.getVariantDownloadUrl.mockResolvedValue({
      url: 'signed-url',
    });

    await controller.getVariantDownloadUrl(req, res, next);

    expect(mocks.getVariantDownloadUrl).toHaveBeenCalledWith('5');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});