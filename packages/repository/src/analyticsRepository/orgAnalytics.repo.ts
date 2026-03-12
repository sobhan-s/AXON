import { PostgresClient as prisma } from '@dam/postgresql_db';
import { Asset } from '@dam/mongodb';
import { logger } from '@dam/config';
import { ApiError } from '@dam/utils';
import type { DateRange } from '@dam/utils';

export class OrgAnalyticsRepository {
  async getStats(orgId: number, range: DateRange) {
    try {
      const [
        org,
        totalMembers,
        projectList,
        tasksByStatus,
        tasksByPriority,
        approvals,
        recentActivity,
        timeLogs,
        memberList,
      ] = await Promise.all([
        prisma.organization.findUnique({
          where: { id: orgId },
          select: {
            id: true,
            name: true,
            status: true,
            storageUsed: true,
            storageLimit: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where: { organizationId: orgId } }),
        prisma.project.findMany({
          where: { organizationId: orgId },
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            _count: { select: { tasks: true, teamMembers: true } },
          },
        }),
        prisma.task.groupBy({
          by: ['status'],
          where: {
            project: { organizationId: orgId },
            createdAt: { gte: range.from, lte: range.to },
          },
          _count: { id: true },
        }),
        prisma.task.groupBy({
          by: ['priority'],
          where: {
            project: { organizationId: orgId },
            createdAt: { gte: range.from, lte: range.to },
          },
          _count: { id: true },
        }),
        prisma.approval.findMany({
          where: {
            task: { project: { organizationId: orgId } },
            requestedAt: { gte: range.from, lte: range.to },
          },
          select: { status: true, requestedAt: true, reviewedAt: true },
        }),
        prisma.activityLog.findMany({
          where: {
            organizationId: orgId,
            createdAt: { gte: range.from, lte: range.to },
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: { user: { select: { id: true, username: true } } },
        }),
        prisma.timeLog.findMany({
          where: {
            task: { project: { organizationId: orgId } },
            loggedAt: { gte: range.from, lte: range.to },
          },
          select: {
            hours: true,
            loggedAt: true,
            user: { select: { id: true, username: true } },
          },
        }),
        prisma.user.findMany({
          where: { organizationId: orgId },
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            lastLoginAt: true,
            assignedTasks: {
              where: {
                project: { organizationId: orgId },
                createdAt: { gte: range.from, lte: range.to },
              },
              select: { status: true },
            },
            timeLogs: {
              where: {
                task: { project: { organizationId: orgId } },
                loggedAt: { gte: range.from, lte: range.to },
              },
              select: { hours: true },
            },
          },
        }),
      ]);

      return {
        org,
        totalMembers,
        projectList,
        tasksByStatus,
        tasksByPriority,
        approvals,
        recentActivity,
        timeLogs,
        memberList,
      };
    } catch (error) {
      logger.error('Error fetching org prisma stats', { error, orgId });
      throw new ApiError(500, 'Database error while fetching org stats');
    }
  }

  async getAssetStats(orgId: number, range: DateRange) {
    try {
      const result = await Asset.aggregate([
        { $match: { organizationId: orgId, deletedAt: null } },
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
            finalized: [
              { $match: { isFinal: true } },
              { $group: { _id: '$fileType', count: { $sum: 1 } } },
            ],
            storageByProject: [
              {
                $group: {
                  _id: '$projectId',
                  totalSize: { $sum: '$fileSize' },
                  count: { $sum: 1 },
                },
              },
              { $sort: { totalSize: -1 } },
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
      logger.error('Error fetching org asset stats', { error, orgId });
      throw new ApiError(500, 'Database error while fetching org asset stats');
    }
  }
}
