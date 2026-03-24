import { PostgresClient as prisma } from '@dam/postgresql_db';
import { logger } from '@dam/config';
import { ApiError } from '@dam/utils';
import type {
  CreateManualTaskPayload,
  UpdateTaskPayload,
  TaskFilters,
} from '../interfaces/task.interface.js';
import { TaskPriority, TaskStatus, TaskType } from '@dam/postgresql_db';

export class TaskRepository {
  async createManualTask(
    projectId: number,
    createdById: number,
    data: CreateManualTaskPayload,
  ) {
    try {
      return await prisma.task.create({
        data: {
          title: data.title,
          description: data.description,
          taskType: 'MANUAL',
          projectId,
          createdById,
          priority: data.priority ?? 'MEDIUM',
          estimatedHours: data.estimatedHours?.toString(),
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          status: 'TODO',
        },
        include: {
          createdBy: { select: { id: true, username: true, avatarUrl: true } },
          assignedTo: { select: { id: true, username: true, avatarUrl: true } },
          project: { select: { id: true, name: true, organizationId: true } },
        },
      });
    } catch (error) {
      logger.error('Error creating manual task', { error });
      throw new ApiError(500, 'Failed to create task');
    }
  }

  async createAssetBasedTask(
    projectId: number,
    uploadedById: number,
    organizationId: number,
    filename: string,
    assetId: string,
  ) {
    try {
      return await prisma.task.create({
        data: {
          title: filename,
          taskType: 'ASSET_BASED',
          projectId,
          createdById: uploadedById,
          status: 'REVIEW',
          assetId,
          priority: 'MEDIUM',
        },
        include: {
          createdBy: { select: { id: true, username: true, avatarUrl: true } },
          assignedTo: { select: { id: true, username: true, avatarUrl: true } },
          project: { select: { id: true, name: true, organizationId: true } },
        },
      });
    } catch (error) {
      logger.error('Error creating asset-based task', { error });
      throw new ApiError(500, 'Failed to create asset task');
    }
  }

  async findTaskById(taskId: number) {
    try {
      return await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          createdBy: { select: { id: true, username: true, avatarUrl: true } },
          assignedTo: { select: { id: true, username: true, avatarUrl: true } },
          project: { select: { id: true, name: true, organizationId: true } },
          approvals: {
            orderBy: { requestedAt: 'desc' },
            take: 1,
            include: {
              requestedBy: { select: { id: true, username: true } },
              reviewedBy: { select: { id: true, username: true } },
            },
          },
          _count: { select: { timeLogs: true, approvals: true } },
        },
      });
    } catch (error) {
      logger.error('Error finding task', { error });
      throw new ApiError(500, 'Failed to find task');
    }
  }

  async findTasksByProject(projectId: number, filters: TaskFilters = {}) {
    try {
      const where: any = {
        projectId: Number(projectId),
      };

      if (filters.status) {
        where.status =
          TaskStatus[filters.status.toUpperCase() as keyof typeof TaskStatus];
      }

      if (filters.priority) {
        where.priority =
          TaskPriority[
            filters.priority.toUpperCase() as keyof typeof TaskPriority
          ];
      }

      if (filters.taskType) {
        where.taskType =
          TaskType[filters.taskType.toUpperCase() as keyof typeof TaskType];
      }

      if (filters.assignedToId) {
        where.assignedToId = Number(filters.assignedToId);
      }

      return await prisma.task.findMany({
        where,
        include: {
          createdBy: { select: { id: true, username: true, avatarUrl: true } },
          assignedTo: { select: { id: true, username: true, avatarUrl: true } },

          _count: { select: { timeLogs: true, approvals: true } },
        },
        orderBy: [{ id: 'asc' }],
      });
    } catch (error) {
      logger.error('Error finding project tasks', {
        projectId,
        filters,
        error,
      });
      throw new ApiError(500, 'Failed to fetch tasks');
    }
  }

  async updateTask(taskId: number, data: UpdateTaskPayload) {
    try {
      return await prisma.task.update({
        where: { id: taskId },
        data: {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          estimatedHours: data.estimatedHours?.toString(),
        },
        include: {
          createdBy: { select: { id: true, username: true, avatarUrl: true } },
          assignedTo: { select: { id: true, username: true, avatarUrl: true } },
        },
      });
    } catch (error) {
      logger.error('Error updating task', { error });
      throw new ApiError(500, 'Failed to update task');
    }
  }

  async updateTaskStatus(taskId: number, status: string) {
    try {
      return await prisma.task.update({
        where: { id: taskId },
        data: {
          status: status as any,
          completedAt: status === 'DONE' ? new Date() : undefined,
        },
      });
    } catch (error) {
      logger.error('Error updating task status', { error });
      throw new ApiError(500, 'Failed to update task status');
    }
  }

  async updateTaskAsset(taskId: number, assetId: string) {
    try {
      return await prisma.task.update({
        where: { id: taskId },
        data: { assetId },
      });
    } catch (error) {
      logger.error('Error linking asset to task', { error });
      throw new ApiError(500, 'Failed to link asset to task');
    }
  }

  async assignTask(taskId: number, assignedTo: number) {
    try {
      return prisma.task.update({
        where: {
          id: taskId,
        },
        data: {
          assignedToId: assignedTo,
        },
      });
    } catch (error) {
      logger.error('Error occurs while assigning the tasks');
      throw new ApiError(500, 'Database error while assigning the tasks');
    }
  }

  async bulkAssignTask(taskId: number[], assignedTo: number) {
    try {
      return await prisma.task.updateMany({
        where: {
          id: {
            in: taskId,
          },
        },
        data: {
          assignedToId: assignedTo,
        },
      });
    } catch (error) {
      logger.error('Error while bulk assigning tasks', { error });
      throw new ApiError(500, 'Database error while bulk assigning tasks');
    }
  }

  async deleteTask(taskId: number) {
    try {
      return await prisma.task.delete({ where: { id: taskId } });
    } catch (error) {
      logger.error('Error deleting task', { error });
      throw new ApiError(500, 'Failed to delete task');
    }
  }

  async deleteBulkTask(taskId: number[]) {
    try {
      return await prisma.task.deleteMany({
        where: {
          id: {
            in: taskId,
          },
        },
      });
    } catch (error) {
      logger.error('Error deleting task', { error });
      throw new ApiError(500, 'Failed to delete task');
    }
  }

  async bulkStaus(taskId: number[], status: TaskStatus) {
    try {
      return await prisma.task.updateMany({
        where: {
          id: {
            in: taskId,
          },
        },
        data: {
          status: status,
        },
      });
    } catch (error) {
      logger.error('Error while changing staus in bulk');
      throw new ApiError(500, 'Database error while changing staus in bulk');
    }
  }

  async getMyOverdueTasks(userId: number) {
    return prisma.task.findMany({
      where: {
        assignedToId: userId,
        dueDate: {
          lt: new Date(),
        },
        status: {
          notIn: ['DONE', 'APPROVED'],
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      include: {
        project: true,
      },
    });
  }

  async getProjectOverdueTasks(projectId: number) {
    return prisma.task.findMany({
      where: {
        projectId,
        dueDate: {
          lt: new Date(),
        },
        status: {
          notIn: ['DONE', 'APPROVED'],
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      include: {
        assignedTo: true,
      },
    });
  }

  async getMyTasks(
    userId: number,
    filters?: {
      status?: TaskStatus;
      projectId?: number;
    },
  ) {
    return prisma.task.findMany({
      where: {
        assignedToId: userId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.projectId && { projectId: filters.projectId }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        project: true,
      },
    });
  }

  async getMemberRole(projectId: number, userId: number) {
    try {
      return await prisma.projectTeamMember.findFirst({
        where: { projectId, userId },
        include: { role: true },
      });
    } catch (error) {
      logger.error('Error getting member role', { error });
      throw new ApiError(500, 'Failed to get member role');
    }
  }

  async findProjectById(projectId: number) {
    try {
      return await prisma.project.findUnique({
        where: {
          id: projectId,
        },
        select: {
          id: true,
          name: true,
        },
      });
    } catch (error) {
      logger.error('Error while find the project by there id ');
      throw new ApiError(
        500,
        'Database error while Error while find the project by there id ',
      );
    }
  }

  async updateOrgStorage(orgId: number, fileSize: number) {
    try {
      await prisma.organization.update({
        where: { id: orgId },
        data: { storageUsed: { increment: BigInt(fileSize) } },
      });
    } catch (error) {
      logger.error('Error comming while update the org storage .')
      throw new ApiError(500, 'Database Error while update the org strgae')
    }
  }
}
