import type { Request, RequestHandler, Response } from 'express';
import { AssetService } from '../service/asset.service.js';
import { ApiResponse, asyncHandler } from '@dam/utils';
import { logger } from '@dam/config';

const assetService = new AssetService();

/* Fetch all assets associated with a specific task */
export const getAssetsByTask: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Fetching assets by task');

    const assets = await assetService.getAssetsByTask(
      Number(req.params.taskId),
    );

    res.json(new ApiResponse(200, assets, 'Assets fetched successfully'));
  },
);

/* Fetch assets for a project with optional filters (fileType, status, isFinal) */
export const getProjectAssets: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Fetching project assets');

    const { fileType, status, isFinal } = req.query;

    const assets = await assetService.getByProjects(
      Number(req.params.projectId),
      fileType as string,
      status as string,
      isFinal as string,
    );

    res.json(new ApiResponse(200, assets, 'Project assets fetched'));
  },
);

/* Fetch a single asset by its unique ID */
export const getAssetById: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Fetching asset by id');

    const asset = await assetService.getAssetById(String(req.params.assetId));

    res.json(new ApiResponse(200, asset, 'Asset fetched successfully'));
  },
);

/* Fetch version history of a specific asset */
export const getAssetVersions: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Fetching asset version history');

    const versions = await assetService.getVersionHistory(
      String(req.params.assetId),
    );

    res.json(new ApiResponse(200, versions, 'Version history fetched'));
  },
);

/* Generate a secure downloadable URL for an asset with expiry */
export const generateDownloadUrl: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Generating download URL');

    const expiry = req.query.expiry ? Number(req.query.expiry) : 3600;

    const result = await assetService.getDownloadUrl(
      String(req.params.assetId),
      expiry,
    );

    res.json(new ApiResponse(200, result, 'Download URL generated'));
  },
);

/* Track asset view activity */
export const trackAssetView: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Tracking asset view');

    const asset = await assetService.viewUrl(String(req.params.assetId));

    res.json(new ApiResponse(200, asset, 'View tracked successfully'));
  },
);

/* Mark an asset as finalized */
export const finalizeAsset: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Finalizing asset');

    const asset = await assetService.finalizeImage(String(req.params.assetId));

    res.json(new ApiResponse(200, asset, 'Asset finalized successfully'));
  },
);

/* Soft delete an asset mark as deleted without permanent removal */
export const deleteAssetSoft: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Soft deleting asset');

    await assetService.deleteImageSoft(String(req.params.assetId));

    res.json(new ApiResponse(200, null, 'Asset deleted successfully'));
  },
);
