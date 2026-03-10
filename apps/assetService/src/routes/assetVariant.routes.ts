import { Router, IRouter } from 'express';
import {
  requestVariants,
  getVariants,
  getVariantDownloadUrl,
} from '../controller/assetVariants.controller.js';
import { authMiddleware } from '@dam/middlewares';

const router: IRouter = Router();

router.route('/:assetId/variants').get(authMiddleware, getVariants);

router.route('/:assetId/variants').post(authMiddleware, requestVariants);

router.route('/:variantId/download').get(authMiddleware, getVariantDownloadUrl);

export default router;
