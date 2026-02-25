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

const getOrganizationMembers: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('fetch orgnization members controller stated . . .');

    const orgId = Number(req.params.orgId);

    const result = await service.getOrgUsers(orgId);

    logger.info('Fetched Successfully all organization users .');

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          'All organization users fetched successfully',
        ),
      );
  },
);

const addUsersToOrganizations: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('add users to the organizations controller stated . . . ');
    const userId = (req as any).user?.id;
    const ip = req.ip!;
    const userAgent = req.get('user-agent')!;
    const orgId = Number(req.params.orgId);

    const creationOfUser = await service.addUserToOranization(
      orgId,
      userId,
      ip,
      userAgent,
      req.body,
    );

    logger.info('creation of user in admin level successfully done');

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          creationOfUser,
          'creation of user in admin level successfully done',
        ),
      );
  },
);

const removeUsersToOrganizations: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Removed user process stated from the controllers .  . .');

    const userId = (req as any).user?.id;
    const targetUserId = req.body.targetUserId;
    const ip = req.ip!;
    const userAgent = req.get('user-agent')!;
    const orgId = Number(req.params.orgId);

    const removedUser = service.removeUserToOrganization(
      orgId,
      userId,
      targetUserId,
      ip,
      userAgent,
    );

    logger.info('User is removed successfully from this organizations .');

    res
      .status(204)
      .json(
        new ApiResponse(204, removedUser, 'User is removed succussfully .'),
      );
  },
);

const getParticularUser: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('get user profile of a particular user');

    const userId = Number(req.params.userId);

    const result = await service.getUserProfiles(userId);

    logger.info('user details fethces successfully');

    res
      .status(200)
      .json(new ApiResponse(200, result, 'user details fethces successfully'));
  },
);

const updateUserDetailInOrg: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('user data is start updating in controller level');

    const ip = req.ip!;
    const userAgent = req.get('user-agent')!;
    const orgId = Number(req.params.orgId);

    const result = service.updateUserDetails(orgId, userAgent, ip, req.body);

    logger.info('user data is updated successfully');

    res
      .status(204)
      .json(
        new ApiResponse(204, result, 'user data is updated successfully .'),
      );
  },
);

export {
  getUserMe,
  updateUserMe,
  deleteMe,
  changePasswordHandler,
  getOrganizationMembers,
  addUsersToOrganizations,
  removeUsersToOrganizations,
  getParticularUser,
  updateUserDetailInOrg
};
