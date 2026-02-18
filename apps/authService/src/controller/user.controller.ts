import { asyncHandler, ApiResponse, ApiError } from '@dam/utils';
import { env_config_variable, logger } from '@dam/config';
import type { RequestHandler, Request, Response } from 'express';
import { CONSTANTS } from '@dam/constants';
import { userService } from '../services/user.service.js';
import { passwordVerifySchema } from '@dam/validations';

const service = new userService();

const getUserMe: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const result = await service.getMe(userId);

    res
      .status(200)
      .json(new ApiResponse(200, result, 'Get user data successfully .'));
  },
);

const updateUserMe: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    console.log(userId);
    const result = service.updateMe(userId, req.body);
    const response = new ApiResponse(
      204,
      result,
      'Profile updated successfully',
    );
    res
      .status(response.statusCode)
      .json({ success: true, message: response.message, data: response.data });
  },
);

const deleteMe: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    const response = new ApiResponse(204, null, 'Account deleted successfully');
    res
      .status(response.statusCode)
      .json({ success: true, message: response.message, data: response.data });
  },
);

const changePasswordHandler: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const data = passwordVerifySchema.safeParse(req.body);
    if (data.error) {
      throw new ApiError(400, data.error.message);
    }
    const parsedData = {
      currentPassword: data.data.currentPassword,
      newPassword: data.data.newPassword,
    };
    await service.changePassword(userId, parsedData);
    const response = new ApiResponse(
      204,
      null,
      'Password changed successfully',
    );
    res
      .status(response.statusCode)
      .json({ success: true, message: response.message, data: response.data });
  },
);

export { getUserMe, updateUserMe, deleteMe, changePasswordHandler };
