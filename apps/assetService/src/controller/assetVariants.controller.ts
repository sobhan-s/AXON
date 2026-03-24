import { Request, Response, NextFunction, RequestHandler } from 'express';
import { queueAssetProcessing } from '../service/VariantQueue.service.js';
import { ApiResponse, asyncHandler } from '@dam/utils';
import { AssetVariantService } from '../service/assetVariant.service.js';
import { logger } from '@dam/config';

const assetVariantService = new AssetVariantService();

/* Request generation of asset variants and queue processing */
export const requestVariants: RequestHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assetId } = req.params;
      const { variants } = req.body as { variants: string[] };

      if (!variants?.length) {
        return res.status(400).json({ message: 'variants array is required' });
      }

      const result = await queueAssetProcessing(
        String(assetId),
        variants as any,
      );

      const msg = {
        message:
          result.queued.length > 0
            ? `Generating: ${result.queued.join(', ')}`
            : 'All requested variants already exist',
      };

      const data = {
        queued: result.queued,
        alreadyExist: result.alreadyExist,
      };

      res.status(200).json(new ApiResponse(200, data, msg.message));
    } catch (err) {
      next(err);
    }
  },
);

/* Fetch all variants of an asset along with processing status */
export const getVariants: RequestHandler = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assetId } = req.params;

      const { asset, variants } = await assetVariantService.getVarinats(
        String(assetId),
      );

      const result = {
        processingStatus: asset.processingStatus,
        processingError: asset.processingError,
        variants,
      };

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            'requested asset variants fetched successfully .',
          ),
        );
    } catch (err) {
      next(err);
    }
  },
);

/* Generate download URL for a specific asset variant */
export const getVariantDownloadUrl: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('getting the download url of varinats');

    const variantId = req.params.variantId;

    const result = await assetVariantService.getVariantDownloadUrl(
      String(variantId),
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          'Asset variant download fetched successfully',
        ),
      );
  },
);
