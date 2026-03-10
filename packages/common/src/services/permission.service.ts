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
        organizationId,
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

  async canCreateTask(userId: number, projectId: number): Promise<boolean> {
    return await this.hasPermission(userId, projectId, 'create_task');
  }

  async canAssignTask(
    userId: number,
    taskId: number,
    targetUserId: number,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return { allowed: false, reason: 'Task not found' };
    }

    const projectId = task.projectId;

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
    });

    if (!task) return false;

    const hasPermission = await this.hasPermission(
      userId,
      task.projectId,
      'update_task',
    );

    if (!hasPermission) return false;

    const userRole = await this.getUserProjectRole(userId, task.projectId);

    if (userRole?.role.name === 'MEMBER') {
      return task.assignedToId === userId;
    }

    return true;
  }

  async canDeleteTask(userId: number, taskId: number): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) return false;

    const hasPermission = await this.hasPermission(
      userId,
      task.projectId,
      'delete_task',
    );

    if (!hasPermission) return false;

    const userRole = await this.getUserProjectRole(userId, task.projectId);

    if (userRole?.role.name === 'LEAD') {
      return task.createdById === userId;
    }

    return true;
  }

  async canUploadAsset(userId: number, projectId: number): Promise<boolean> {
    return await this.hasPermission(userId, projectId, 'upload_asset');
  }

  async canApproveAsset(userId: number, taskId: number): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) return false;

    return await this.hasPermission(userId, task.projectId, 'approve_asset');
  }

  async canRejectAsset(userId: number, taskId: number): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) return false;

    return await this.hasPermission(userId, task.projectId, 'reject_asset');
  }

  async canFinalizeAsset(userId: number, taskId: number): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) return false;

    return await this.hasPermission(userId, task.projectId, 'finalize_asset');
  }

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
