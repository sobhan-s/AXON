import { PostgresClient as prisma } from '@dam/postgresql_db';
import { Asset } from '@dam/mongodb';
import { logger } from '@dam/config';
import { ApiError } from '@dam/utils';
import type { DateRange } from '@dam/utils';

export class PlatformAnalyticsRepository {
  async getStats(range: DateRange) {
    try {
      const [
        totalOrgs,
        activeOrgs,
        totalUsers,
        newUsers,
        totalProjects,
        activeProjects,
        tasksByStatus,
        tasksByPriority,
        approvalsByStatus,
        timeLogTotal,
        orgStorage,
        orgList,
        recentActivity,
      ] = await Promise.all([
        prisma.organization.count(),
        prisma.organization.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count(),
        prisma.user.count({
          where: { createdAt: { gte: range.from, lte: range.to } },
        }),
        prisma.project.count(),
        prisma.project.count({ where: { status: 'ACTIVE' } }),
        prisma.task.groupBy({ by: ['status'], _count: { id: true } }),
        prisma.task.groupBy({ by: ['priority'], _count: { id: true } }),
        prisma.approval.groupBy({ by: ['status'], _count: { id: true } }),
        prisma.timeLog.aggregate({
          where: { loggedAt: { gte: range.from, lte: range.to } },
          _sum: { hours: true },
        }),
        prisma.organization.aggregate({
          _sum: { storageUsed: true, storageLimit: true },
        }),
        prisma.organization.findMany({
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            storageUsed: true,
            storageLimit: true,
            _count: { select: { users: true, projects: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.activityLog.findMany({
          where: { createdAt: { gte: range.from, lte: range.to } },
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: { user: { select: { id: true, username: true } } },
        }),
      ]);

      return {
        totalOrgs,
        activeOrgs,
        totalUsers,
        newUsers,
        totalProjects,
        activeProjects,
        tasksByStatus,
        tasksByPriority,
        approvalsByStatus,
        timeLogTotal,
        orgStorage,
        orgList,
        recentActivity,
      };
    } catch (error) {
      logger.error('Error fetching platform prisma stats', { error });
      throw new ApiError(500, 'Database error while fetching platform stats');
    }
  }

  async getAssetStats(range: DateRange) {
    try {
      const result = await Asset.aggregate([
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalSize: { $sum: '$fileSize' },
                },
              },
            ],
            byType: [
              {
                $group: {
                  _id: '$fileType',
                  count: { $sum: 1 },
                  totalSize: { $sum: '$fileSize' },
                },
              },
            ],
            uploadsByDay: [
              { $match: { createdAt: { $gte: range.from, $lte: range.to } } },
              {
                $group: {
                  _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                  },
                  count: { $sum: 1 },
                  totalSize: { $sum: '$fileSize' },
                },
              },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ]);

      return result[0];
    } catch (error) {
      logger.error('Error fetching platform asset stats', { error });
      throw new ApiError(
        500,
        'Database error while fetching platform asset stats',
      );
    }
  }
}
