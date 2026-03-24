import { IRouter, Router } from 'express';
import {
  getAssetsByTask,
  getProjectAssets,
  getAssetById,
  getAssetVersions,
  generateDownloadUrl,
  trackAssetView,
  finalizeAsset,
  deleteAssetSoft,
} from '../controller/asset.controller.js';

const router: IRouter = Router();

/* Fetch all assets associated with a specific task */
router.get('/task/:taskId', getAssetsByTask);

/* Fetch project assets with optional filters */
router.get('/project/:projectId', getProjectAssets);

/* Fetch asset details by ID */
router.get('/:assetId', getAssetById);

/* Fetch version history of an asset */
router.get('/:assetId/versions', getAssetVersions);

/* Generate download URL for an asset */
router.get('/:assetId/download', generateDownloadUrl);

/* Track asset view activity */
router.post('/:assetId/view', trackAssetView);

/* Finalize an asset */
router.patch('/:assetId/finalize', finalizeAsset);

/* Soft delete an asset */
router.delete('/:assetId', deleteAssetSoft);

export default router;
