import { IRouter, Router, type Request, type Response } from 'express';
import { authMiddleware } from '@dam/middlewares';
import { asyncHandler } from '@dam/utils';
import { ApiResponse } from '@dam/utils';
import { MINIO_MAX_FILE_SIZE } from '@dam/config';
import { tusServer } from '../services/asset.service.js';
import { AssetRepository } from '../repository/asset.repository.js';

const assetRepository = new AssetRepository();
const router: IRouter = Router();

// router.options('/upload', (req: Request, res: Response) =>
//   tusServer.handle(req, res),
// );

// // All other TUS methods — with auth
router.all('/upload', (req: Request, res: Response) =>
  tusServer.handle(req, res),
);

router.all('/upload/:id', (req: Request, res: Response) =>
  tusServer.handle(req, res),
);

// router.use(authMiddleware);

router.get(
  '/task/:taskId',
  asyncHandler(async (req, res) => {
    const assets = await assetRepository.getByTask(Number(req.params.taskId));
    res.json(new ApiResponse(200, assets, 'Assets fetched'));
  }),
);

router.get(
  '/project/:projectId',
  asyncHandler(async (req, res) => {
    const { fileType, status, isFinal } = req.query;
    const assets = await assetRepository.getByProject(
      Number(req.params.projectId),
      {
        fileType: fileType as string,
        status: status as string,
        isFinal: isFinal === 'true',
      },
    );
    res.json(new ApiResponse(200, assets, 'Project assets fetched'));
  }),
);

router.get(
  '/:assetId',
  asyncHandler(async (req, res) => {
    const asset = await assetRepository.getById(String(req.params.assetId));
    res.json(new ApiResponse(200, asset, 'Asset fetched'));
  }),
);

router.get(
  '/:assetId/versions',
  asyncHandler(async (req, res) => {
    const versions = await assetRepository.getVersionHistory(
      String(req.params.assetId),
    );
    res.json(new ApiResponse(200, versions, 'Version history fetched'));
  }),
);

router.get(
  '/:assetId/download',
  asyncHandler(async (req, res) => {
    const expiry = req.query.expiry ? Number(req.query.expiry) : 3600;
    const result = await assetRepository.getDownloadUrl(
      String(req.params.assetId),
      expiry,
    );
    res.json(new ApiResponse(200, result, 'Download URL generated'));
  }),
);

router.post(
  '/:assetId/view',
  asyncHandler(async (req, res) => {
    const asset = await assetRepository.trackView(String(req.params.assetId));
    res.json(new ApiResponse(200, asset, 'View tracked'));
  }),
);

router.patch(
  '/:assetId/finalize',
  asyncHandler(async (req, res) => {
    const asset = await assetRepository.finalize(String(req.params.assetId));
    res.json(new ApiResponse(200, asset, 'Asset finalized'));
  }),
);

router.delete(
  '/:assetId',
  asyncHandler(async (req, res) => {
    await assetRepository.softDelete(String(req.params.assetId));
    res.json(new ApiResponse(200, null, 'Asset deleted'));
  }),
);

export default router;
