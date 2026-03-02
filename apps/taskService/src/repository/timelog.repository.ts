import { logger } from '@dam/config';
import { prisma } from '../index.js';
import { ApiError } from '@dam/utils';

export class TimelogRepository {
  async openSession(taskId: number, userId: number) {
    try {
      return await prisma.timeLog.create({
        data: {
          taskId,
          userId,
          hours: '0',
          startedAt: new Date(),
          loggedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error opening timelog session', { error });
      throw new ApiError(500, 'Failed to start time tracking');
    }
  }

  async closeSession(taskId: number, userId: number) {
    try {
      const openSession = await prisma.timeLog.findFirst({
        where: {
          taskId,
          userId,
          endedAt: null,
        },
        orderBy: { startedAt: 'desc' },
      });

      if (!openSession) return null;

      const endedAt = new Date();
      const startedAt = openSession.startedAt;
      const diffMs = endedAt.getTime() - startedAt.getTime();
      const hours = diffMs / (1000 * 60 * 60);
      const hoursRounded = Math.max(0.01, Math.round(hours * 100) / 100);

      return await prisma.timeLog.update({
        where: { id: openSession.id },
        data: {
          endedAt,
          hours: hoursRounded.toString(),
          loggedAt: endedAt,
        },
      });
    } catch (error) {
      logger.error('Error closing timelog session', { error });
      throw new ApiError(500, 'Failed to stop time tracking');
    }
  }

  async findTimeLogsByTask(taskId: number) {
    try {
      return await prisma.timeLog.findMany({
        where: { taskId },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { startedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error finding time logs', { error });
      throw new ApiError(500, 'Failed to fetch time logs');
    }
  }

  async findTimeLogsByUser(taskId: number, userId: number) {
    try {
      return await prisma.timeLog.findMany({
        where: { taskId, userId },
        orderBy: { startedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error finding user time logs', { error });
      throw new ApiError(500, 'Failed to fetch time logs');
    }
  }

  async findTimeLogById(timeLogId: number) {
    try {
      return await prisma.timeLog.findUnique({ where: { id: timeLogId } });
    } catch (error) {
      logger.error('Error finding time log', { error });
      throw new ApiError(500, 'Failed to find time log');
    }
  }

  async deleteTimeLog(timeLogId: number) {
    try {
      return await prisma.timeLog.delete({ where: { id: timeLogId } });
    } catch (error) {
      logger.error('Error deleting time log', { error });
      throw new ApiError(500, 'Failed to delete time log');
    }
  }

  async getTotalHours(taskId: number) {
    try {
      const result = await prisma.timeLog.aggregate({
        where: { taskId, endedAt: { not: null } },
        _sum: { hours: true },
      });
      return Number(result._sum.hours ?? 0);
    } catch (error) {
      logger.error('Error aggregating hours', { error });
      throw new ApiError(500, 'Failed to calculate hours');
    }
  }

  async getTotalHoursByUser(taskId: number, userId: number) {
    try {
      const result = await prisma.timeLog.aggregate({
        where: { taskId, userId, endedAt: { not: null } },
        _sum: { hours: true },
      });
      return Number(result._sum.hours ?? 0);
    } catch (error) {
      logger.error('Error aggregating user hours', { error });
      throw new ApiError(500, 'Failed to calculate hours');
    }
  }
}
