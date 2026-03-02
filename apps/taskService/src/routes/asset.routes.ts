import { IRouter, Router, type Request, type Response } from 'express';
import { authMiddleware } from '@dam/middlewares';
import { asyncHandler } from '@dam/utils';
import { ApiResponse } from '@dam/utils';
import { MINIO_MAX_FILE_SIZE } from '@dam/config';
import { tusServer, assetService } from '../services/asset.service.js';

const router: IRouter = Router();

router.all('/upload', authMiddleware, (req: Request, res: Response) =>
  tusServer.handle(req, res),
);

router.options('/upload', (_req: Request, res: Response) => {
  res.setHeader('Tus-Resumable', '1.0.0');
  res.setHeader('Tus-Version', '1.0.0');
  res.setHeader('Tus-Max-Size', String(MINIO_MAX_FILE_SIZE));
  res.setHeader('Tus-Extension', 'creation,expiration,termination');
  res.status(204).send();
});

router.use(authMiddleware);

router.get(
  '/task/:taskId',
  asyncHandler(async (req, res) => {
    const assets = await assetService.getByTask(Number(req.params.taskId));
    res.json(new ApiResponse(200, assets, 'Assets fetched'));
  }),
);

router.get(
  '/project/:projectId',
  asyncHandler(async (req, res) => {
    const { fileType, status, isFinal } = req.query;
    const assets = await assetService.getByProject(
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
    const asset = await assetService.getById(String(req.params.assetId));
    res.json(new ApiResponse(200, asset, 'Asset fetched'));
  }),
);

router.get(
  '/:assetId/versions',
  asyncHandler(async (req, res) => {
    const versions = await assetService.getVersionHistory(String(req.params.assetId));
    res.json(new ApiResponse(200, versions, 'Version history fetched'));
  }),
);

router.get(
  '/:assetId/download',
  asyncHandler(async (req, res) => {
    const expiry = req.query.expiry ? Number(req.query.expiry) : 3600;
    const result = await assetService.getDownloadUrl(
      String(req.params.assetId),
      expiry,
    );
    res.json(new ApiResponse(200, result, 'Download URL generated'));
  }),
);

router.post(
  '/:assetId/view',
  asyncHandler(async (req, res) => {
    const asset = await assetService.trackView(String(req.params.assetId));
    res.json(new ApiResponse(200, asset, 'View tracked'));
  }),
);

router.patch(
  '/:assetId/finalize',
  asyncHandler(async (req, res) => {
    const asset = await assetService.finalize(String(req.params.assetId));
    res.json(new ApiResponse(200, asset, 'Asset finalized'));
  }),
);

router.delete(
  '/:assetId',
  asyncHandler(async (req, res) => {
    await assetService.softDelete(String(req.params.assetId));
    res.json(new ApiResponse(200, null, 'Asset deleted'));
  }),
);

export default router;
