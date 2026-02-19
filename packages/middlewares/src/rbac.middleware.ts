import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '@dam/common';
import { ApiError } from '@dam/utils';
import { logger } from '@dam/config';

const permissionService = new PermissionService();

export async function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log('`11111111111111111111');

  try {
    const userId = (req as any).user?.id;
    console.log(userId);

    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const isSuperAdmin = await permissionService.isSuperAdmin(userId);

    if (!isSuperAdmin) {
      throw new ApiError(403, 'Super Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requireOrgAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const organizationId = parseInt(
        req.params.organizationId ||
          req.body.organizationId ||
          (req.query.organizationId as string),
      );

      if (!organizationId) {
        throw new ApiError(400, 'Organization ID required');
      }

      const canAccess = await permissionService.canAccessOrganization(
        userId,
        organizationId,
      );

      if (!canAccess) {
        throw new ApiError(403, 'Access denied to this organization');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireProjectAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const projectId = parseInt(
        req.params.projectId ||
          req.body.projectId ||
          (req.query.projectId as string),
      );

      if (!projectId) {
        throw new ApiError(400, 'Project ID required');
      }

      const canAccess = await permissionService.canAccessProject(
        userId,
        projectId,
      );

      if (!canAccess) {
        throw new ApiError(403, 'Not a member of this project');
      }

      (req as any).projectId = projectId;

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireModuleAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const moduleId = parseInt(
        req.params.moduleId ||
          req.body.moduleId ||
          (req.query.moduleId as string),
      );

      if (!moduleId) {
        throw new ApiError(400, 'Module ID required');
      }

      const canAccess = await permissionService.canAccessModule(
        userId,
        moduleId,
      );

      if (!canAccess) {
        throw new ApiError(403, 'Access denied to this module');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      let projectId: number;
      let allowed = false;

      switch (permission) {
        case 'create_project':
        case 'update_organization':
        case 'manage_org_users': {
          const organizationId = parseInt(
            req.params.organizationId ||
              req.body.organizationId ||
              (req as any).user?.organizationId,
          );

          if (!organizationId) {
            throw new ApiError(400, 'Organization context required');
          }

          allowed = await permissionService.isOrgAdmin(userId, organizationId);
          break;
        }

        case 'create_module':
        case 'update_project':
        case 'delete_project': {
          projectId = parseInt(
            req.params.projectId ||
              req.body.projectId ||
              (req as any).projectId,
          );

          if (!projectId) {
            throw new ApiError(400, 'Project context required');
          }

          allowed = await permissionService.hasPermission(
            userId,
            projectId,
            permission,
          );
          break;
        }

        case 'create_task': {
          const moduleId = parseInt(req.body.moduleId);
          if (!moduleId) {
            throw new ApiError(400, 'Module ID required');
          }

          allowed = await permissionService.canCreateTask(userId, moduleId);
          break;
        }

        case 'upload_asset': {
          const uploadModuleId = parseInt(req.body.moduleId);
          if (!uploadModuleId) {
            throw new ApiError(400, 'Module ID required');
          }

          allowed = await permissionService.canUploadAsset(
            userId,
            uploadModuleId,
          );
          break;
        }

        case 'approve_asset': {
          const approveTaskId = parseInt(req.params.taskId || req.body.taskId);

          if (!approveTaskId) {
            throw new ApiError(400, 'Task ID required');
          }

          allowed = await permissionService.canApproveAsset(
            userId,
            approveTaskId,
          );
          break;
        }

        case 'reject_asset': {
          const rejectTaskId = parseInt(req.params.taskId || req.body.taskId);

          if (!rejectTaskId) {
            throw new ApiError(400, 'Task ID required');
          }

          allowed = await permissionService.canRejectAsset(
            userId,
            rejectTaskId,
          );
          break;
        }

        case 'finalize_asset': {
          const finalizeTaskId = parseInt(req.params.taskId || req.body.taskId);

          if (!finalizeTaskId) {
            throw new ApiError(400, 'Task ID required');
          }

          allowed = await permissionService.canFinalizeAsset(
            userId,
            finalizeTaskId,
          );
          break;
        }

        default:
          throw new ApiError(500, `Unknown permission: ${permission}`);
      }

      if (!allowed) {
        logger.warn('Permission denied', {
          userId,
          permission,
          route: req.path,
        });

        throw new ApiError(
          403,
          `You don't have permission to ${permission.replace('_', ' ')}`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireTaskUpdatePermission() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const taskId = parseInt((req as any).params.taskId);

      if (!taskId) {
        throw new ApiError(400, 'Task ID required');
      }

      const canUpdate = await permissionService.canUpdateTask(userId, taskId);

      if (!canUpdate) {
        throw new ApiError(403, 'You cannot update this task');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireTaskDeletePermission() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const taskId = parseInt((req as any).params.taskId);

      if (!taskId) {
        throw new ApiError(400, 'Task ID required');
      }

      const canDelete = await permissionService.canDeleteTask(userId, taskId);

      if (!canDelete) {
        throw new ApiError(403, 'You cannot delete this task');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
