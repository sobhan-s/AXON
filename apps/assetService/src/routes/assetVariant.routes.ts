import { Router, IRouter } from 'express';
import {
  requestVariants,
  getVariants,
  getVariantDownloadUrl,
} from '../controller/assetVariants.controller.js';
import { authMiddleware } from '@dam/middlewares';

const router: IRouter = Router();

/* Fetch all variants of a specific asset */
router.route('/:assetId/variants').get(authMiddleware, getVariants);

/* Request generation of variants for a specific asset */
router.route('/:assetId/variants').post(authMiddleware, requestVariants);

/* Generate download URL for a specific asset variant */
router.route('/:variantId/download').get(authMiddleware, getVariantDownloadUrl);

export default router;
