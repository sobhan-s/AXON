import { logger } from '@dam/config';
import { PostgresClient as prisma } from '@dam/postgresql_db';
import { ApiError } from '@dam/utils';

export class ProjectAnalyticsRepository {
  async findUniqueProject(projectId: number) {
    try {
      return await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true, status: true, startDate: true, endDate: true },
      });
    } catch (error) {
      logger.error('Error while finding project in project anlaytics ');
      throw new ApiError(
        500,
        'Database error while finding project in project anlaytics ',
      );
    }
  }

  async groupTaskStatus(projectId: number, from: Date, to: Date) {
    try {
      return prisma.task.groupBy({
        by: ['status'],
        where: { projectId, createdAt: { gte: from, lte: to } },
        _count: { id: true },
      });
    } catch (error) {
      logger.error('Error while Grouping task in projectAnalytics');
      throw new ApiError(
        500,
        'Database error while Grouping task in projectAnalytics',
      );
    }
  }

  async groupTaskPriotiry(projectId: number, from: Date, to: Date) {
    try {
      return await prisma.task.groupBy({
        by: ['priority'],
        where: { projectId, createdAt: { gte: from, lte: to } },
        _count: { id: true },
      });
    } catch (error) {
      logger.error('Error while group task by priority');
      throw new ApiError(500, 'Database erro while group task by priority');
    }
  }

  async countTask(projectId: number) {
    try {
      return await prisma.task.count({
        where: {
          projectId,
          dueDate: { lt: new Date() },
          status: { notIn: ['DONE', 'APPROVED'] },
        },
      });
    } catch (error) {
      logger.error('Error while couting the tas in anlytics');
      throw new ApiError(
        500,
        'Database eror while couting the tas in anlytics',
      );
    }
  }

  async countApproval(projectId: number) {
    try {
      return await prisma.approval.count({
        where: { status: 'PENDING', task: { projectId } },
      });
    } catch (error) {
      logger.error('Error while counting the approval .');
      throw new ApiError(500, 'Databse error while counting the approval .');
    }
  }

  async aggrigateTimelog(projectId: number, from: Date, to: Date) {
    try {
      return await prisma.timeLog.aggregate({
        where: {
          task: { projectId },
          loggedAt: { gte: from, lte: to },
        },
        _sum: { hours: true },
      });
    } catch (error) {
      logger.error('Error while aggrigate the timelogs');
      throw new ApiError(500, 'Datbase error while aggrigate the timelogs');
    }
  }
}
