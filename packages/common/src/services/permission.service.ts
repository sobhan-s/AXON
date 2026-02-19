import { PostgresClient as prisma } from '@dam/postgresql_db';
import { logger } from '@dam/config';

export class PermissionService {
  async isSuperAdmin(userId: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        organizationId: true,
        isActive: true,
      },
    });
    console.log(user);

    if (!user) return false;

    return user.isActive && user.organizationId === null;
  }

  async getSuperAdmins(): Promise<any[]> {
    return await prisma.user.findMany({
      where: {
        organizationId: null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });
  }

  async getUserPermissions(
    userId: number,
    projectId: number,
  ): Promise<string[]> {
    const membership = await prisma.projectTeamMember.findFirst({
      where: { userId, projectId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!membership) return [];

    return membership.role.permissions.map((rp) => rp.permission.name);
  }

  async hasPermission(
    userId: number,
    projectId: number,
    permissionName: string,
  ): Promise<boolean> {
    if (await this.isSuperAdmin(userId)) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (project?.organizationId) {
        logger.warn('Super admin attempted to access org internal resource', {
          userId,
          projectId,
        });
        return false;
      }

      return true;
    }

    const permissions = await this.getUserPermissions(userId, projectId);
    return permissions.includes(permissionName);
  }

  async isProjectMember(userId: number, projectId: number): Promise<boolean> {
    const membership = await prisma.projectTeamMember.findFirst({
      where: { userId, projectId },
    });

    return !!membership;
  }

  async getUserProjectRole(userId: number, projectId: number) {
    return await prisma.projectTeamMember.findFirst({
      where: { userId, projectId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  async isOrgAdmin(userId: number, organizationId: number): Promise<boolean> {
    const membership = await prisma.projectTeamMember.findFirst({
      where: {
        userId,
        project: { organizationId },
        role: { name: 'ADMIN' },
      },
    });

    return !!membership;
  }

  async canAccessOrganization(
    userId: number,
    organizationId: number,
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user?.organizationId === organizationId;
  }

  async canAccessProject(userId: number, projectId: number): Promise<boolean> {
    return await this.isProjectMember(userId, projectId);
  }

  async canManageProject(userId: number, projectId: number): Promise<boolean> {
    return await this.hasPermission(userId, projectId, 'update_project');
  }

  async canDeleteProject(userId: number, projectId: number): Promise<boolean> {
    return await this.hasPermission(userId, projectId, 'delete_project');
  }

  async canAccessModule(userId: number, moduleId: number): Promise<boolean> {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { project: true },
    });

    if (!module) return false;

    return await this.isProjectMember(userId, module.projectId);
  }

  async canManageModule(userId: number, moduleId: number): Promise<boolean> {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { project: true },
    });

    if (!module) return false;

    const hasPermission = await this.hasPermission(
      userId,
      module.projectId,
      'update_module',
    );

    if (!hasPermission) return false;

    const userRole = await this.getUserProjectRole(userId, module.projectId);

    if (userRole?.role.name === 'MANAGER') {
      return module.assignedTo === userId;
    }

    return userRole?.role.name === 'ADMIN';
  }

  async canCreateTask(userId: number, moduleId: number): Promise<boolean> {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { project: true },
    });

    if (!module) return false;

    return await this.hasPermission(userId, module.projectId, 'create_task');
  }

  async canAssignTask(
    userId: number,
    taskId: number,
    targetUserId: number,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        module: { include: { project: true } },
      },
    });

    if (!task) {
      return { allowed: false, reason: 'Task not found' };
    }

    const projectId = task.module.projectId;

    const [isUserInProject, isTargetInProject] = await Promise.all([
      this.isProjectMember(userId, projectId),
      this.isProjectMember(targetUserId, projectId),
    ]);

    if (!isUserInProject) {
      return { allowed: false, reason: 'You are not a project member' };
    }

    if (!isTargetInProject) {
      return { allowed: false, reason: 'Target user is not a project member' };
    }

    return { allowed: true };
  }

  async canUpdateTask(userId: number, taskId: number): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        module: { include: { project: true } },
      },
    });

    if (!task) return false;

    const hasPermission = await this.hasPermission(
      userId,
      task.module.projectId,
      'update_task',
    );

    if (!hasPermission) return false;

    const userRole = await this.getUserProjectRole(
      userId,
      task.module.projectId,
    );

    if (userRole?.role.name === 'MEMBER') {
      return task.assignedToId === userId;
    }

    return true;
  }

  async canDeleteTask(userId: number, taskId: number): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        module: { include: { project: true } },
      },
    });

    if (!task) return false;

    const hasPermission = await this.hasPermission(
      userId,
      task.module.projectId,
      'delete_task',
    );

    if (!hasPermission) return false;

    // LEAD can only delete tasks they created
    const userRole = await this.getUserProjectRole(
      userId,
      task.module.projectId,
    );

    if (userRole?.role.name === 'LEAD') {
      return task.createdById === userId;
    }

    return true;
  }

  async canUploadAsset(userId: number, moduleId: number): Promise<boolean> {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { project: true },
    });

    if (!module) return false;

    return await this.hasPermission(userId, module.projectId, 'upload_asset');
  }

  async canApproveAsset(userId: number, taskId: number): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        module: { include: { project: true } },
      },
    });

    if (!task) return false;

    return await this.hasPermission(
      userId,
      task.module.projectId,
      'approve_asset',
    );
  }

  async canRejectAsset(userId: number, taskId: number): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        module: { include: { project: true } },
      },
    });

    if (!task) return false;

    return await this.hasPermission(
      userId,
      task.module.projectId,
      'reject_asset',
    );
  }

  async canFinalizeAsset(userId: number, taskId: number): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        module: { include: { project: true } },
      },
    });

    if (!task) return false;

    return await this.hasPermission(
      userId,
      task.module.projectId,
      'finalize_asset',
    );
  }

  //   async canDeleteAsset(userId: number, assetId: string): Promise<boolean> {
  //     // Get asset from MongoDB to find taskId
  //     const { Asset } = await import('@dam/mongodb');

  //     const asset = await Asset.findById(assetId);
  //     if (!asset) return false;

  //     // Get task to find project
  //     const task = await prisma.task.findUnique({
  //       where: { id: asset.taskId },
  //       include: {
  //         module: { include: { project: true } },
  //       },
  //     });

  //     if (!task) return false;

  //     const hasPermission = await this.hasPermission(
  //       userId,
  //       task.module.projectId,
  //       'delete_asset',
  //     );

  //     if (!hasPermission) return false;

  //     const userRole = await this.getUserProjectRole(
  //       userId,
  //       task.module.projectId,
  //     );

  //     if (userRole?.role.name === 'MEMBER') {
  //       return asset.uploadedBy === userId && asset.status !== 'approved';
  //     }

  //     return true;
  //   }

  async canViewOrgAnalytics(
    userId: number,
    organizationId: number,
  ): Promise<boolean> {
    return await this.isOrgAdmin(userId, organizationId);
  }

  async canViewProjectAnalytics(
    userId: number,
    projectId: number,
  ): Promise<boolean> {
    return await this.hasPermission(
      userId,
      projectId,
      'view_project_analytics',
    );
  }
}
