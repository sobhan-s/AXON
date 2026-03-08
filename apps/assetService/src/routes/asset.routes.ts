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

router.get('/task/:taskId', getAssetsByTask);

router.get('/project/:projectId', getProjectAssets);

router.get('/:assetId', getAssetById);

router.get('/:assetId/versions', getAssetVersions);

router.get('/:assetId/download', generateDownloadUrl);

router.post('/:assetId/view', trackAssetView);

router.patch('/:assetId/finalize', finalizeAsset);

router.delete('/:assetId', deleteAssetSoft);

export default router;
