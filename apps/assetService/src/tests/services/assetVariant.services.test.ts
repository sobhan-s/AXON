import { describe, it, expect, vi, beforeEach } from 'vitest';

let AssetVariantService: any;

const repoMocks = {
  getVariantsById: vi.fn(),
  getVariantDownloadUrl: vi.fn(),
};

const assetMock = {
  findById: vi.fn(),
};

const variantMock = {
  find: vi.fn(),
};

vi.mock('@dam/mongodb', () => {
  return {
    Asset: assetMock,
    AssetVariant: variantMock,
  };
});

vi.mock('@dam/repository', () => {
  return {
    AssetRepository: class {},
    AssetVariantRepository: class {
      getVariantsById = repoMocks.getVariantsById;
      getVariantDownloadUrl = repoMocks.getVariantDownloadUrl;
    },
  };
});

describe('AssetVariantService', () => {
  let service: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const module = await import('../../service/assetVariant.service.js');
    AssetVariantService = module.AssetVariantService;

    service = new AssetVariantService();
  });

  it('should fetch asset variants', async () => {
    assetMock.findById.mockResolvedValue({
      processingStatus: 'COMPLETED',
      processingError: null,
    });

    const sortMock = vi.fn().mockResolvedValue([{ id: 1 }]);
    variantMock.find.mockReturnValue({ sort: sortMock });

    const result = await service.getVarinats('asset1');

    expect(assetMock.findById).toHaveBeenCalledWith(
      'asset1',
      'processingStatus processingError'
    );

    expect(variantMock.find).toHaveBeenCalledWith({ assetId: 'asset1' });

    expect(result).toEqual({
      asset: {
        processingStatus: 'COMPLETED',
        processingError: null,
      },
      variants: [{ id: 1 }],
    });
  });

  it('should throw error if asset not found', async () => {
    assetMock.findById.mockResolvedValue(null);

    const sortMock = vi.fn().mockResolvedValue([]);
    variantMock.find.mockReturnValue({ sort: sortMock });

    await expect(service.getVarinats('asset1')).rejects.toThrow();
  });

  it('should generate variant download url', async () => {
    repoMocks.getVariantsById.mockResolvedValue({
      url: 'variant-path',
    });

    repoMocks.getVariantDownloadUrl.mockResolvedValue({
      url: 'signed-url',
    });

    const result = await service.getVariantDownloadUrl('v1');

    expect(repoMocks.getVariantsById).toHaveBeenCalledWith('v1');

    expect(repoMocks.getVariantDownloadUrl).toHaveBeenCalledWith('variant-path');

    expect(result).toEqual({
      url: 'signed-url',
    });
  });

  it('should throw error if variant not found', async () => {
    repoMocks.getVariantsById.mockResolvedValue(null);

    await expect(service.getVariantDownloadUrl('v1')).rejects.toThrow();
  });
});