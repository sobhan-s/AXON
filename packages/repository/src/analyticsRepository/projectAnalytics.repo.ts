import { PostgresClient as prisma } from '@dam/postgresql_db';
import { Asset, AssetVariant } from '@dam/mongodb';
import { logger } from '@dam/config';
import { ApiError } from '@dam/utils';
import type { DateRange } from '@dam/utils';

export class ProjectAnalyticsRepository {
  async getStats(projectId: number, range: DateRange) {
    try {
      const [
        project,
        allTasks,
        approvals,
        timeLogs,
        teamMembers,
        recentActivity,
      ] = await Promise.all([
        prisma.project.findUnique({
          where: { id: projectId },
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            creator: { select: { id: true, username: true, avatarUrl: true } },
            assignee: { select: { id: true, username: true, avatarUrl: true } },
            _count: { select: { tasks: true, teamMembers: true } },
          },
        }),
        prisma.task.findMany({
          where: { projectId },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            taskType: true,
            dueDate: true,
            createdAt: true,
            completedAt: true,
            estimatedHours: true,
            assignedTo: {
              select: { id: true, username: true, avatarUrl: true },
            },
            timeLogs: { select: { hours: true } },
          },
        }),
        prisma.approval.findMany({
          where: { task: { projectId } },
          select: {
            id: true,
            status: true,
            requestedAt: true,
            reviewedAt: true,
            comments: true,
            requestedBy: { select: { id: true, username: true } },
            reviewedBy: { select: { id: true, username: true } },
            task: { select: { id: true, title: true } },
          },
          orderBy: { requestedAt: 'desc' },
        }),
        prisma.timeLog.findMany({
          where: {
            task: { projectId },
            loggedAt: { gte: range.from, lte: range.to },
          },
          select: {
            id: true,
            hours: true,
            loggedAt: true,
            description: true,
            task: { select: { id: true, title: true } },
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
          orderBy: { loggedAt: 'desc' },
        }),
        prisma.projectTeamMember.findMany({
          where: { projectId },
          select: {
            addedAt: true,
            role: { select: { name: true, level: true } },
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatarUrl: true,
                lastLoginAt: true,
              },
            },
          },
        }),
        prisma.activityLog.findMany({
          where: {
            createdAt: { gte: range.from, lte: range.to },
            entityType: { in: ['task', 'asset', 'approval', 'project'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        }),
      ]);

      return {
        project,
        allTasks,
        approvals,
        timeLogs,
        teamMembers,
        recentActivity,
      };
    } catch (error) {
      logger.error('Error fetching project prisma stats', { error, projectId });
      throw new ApiError(500, 'Database error while fetching project stats');
    }
  }

  async getAssetStats(projectId: number, range: DateRange) {
    try {
      const result = await Asset.aggregate([
        { $match: { projectId, deletedAt: null } },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalSize: { $sum: '$fileSize' },
                  avgSize: { $avg: '$fileSize' },
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
            byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            byProcessingStatus: [
              { $group: { _id: '$processingStatus', count: { $sum: 1 } } },
            ],
            finalized: [
              { $match: { isFinal: true } },
              {
                $group: {
                  _id: '$fileType',
                  count: { $sum: 1 },
                  totalSize: { $sum: '$fileSize' },
                },
              },
            ],
            recentUploads: [
              { $sort: { createdAt: -1 } },
              { $limit: 10 },
              {
                $project: {
                  originalName: 1,
                  fileType: 1,
                  mimeType: 1,
                  fileSize: 1,
                  version: 1,
                  status: 1,
                  isFinal: 1,
                  createdAt: 1,
                  uploadedBy: 1,
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
            byUploader: [
              { $group: { _id: '$uploadedBy', count: { $sum: 1 } } },
            ],
          },
        },
      ]);

      return result[0];
    } catch (error) {
      logger.error('Error fetching project asset stats', { error, projectId });
      throw new ApiError(
        500,
        'Database error while fetching project asset stats',
      );
    }
  }

  async getVariantStats(projectId: number) {
    try {
      const result = await AssetVariant.aggregate([
        {
          $lookup: {
            from: 'assets',
            localField: 'assetId',
            foreignField: '_id',
            as: 'asset',
          },
        },
        { $unwind: '$asset' },
        { $match: { 'asset.projectId': projectId, 'asset.deletedAt': null } },
        {
          $facet: {
            byType: [
              { $group: { _id: '$variantType', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            total: [{ $count: 'count' }],
          },
        },
      ]);

      return result[0];
    } catch (error) {
      logger.error('Error fetching project variant stats', {
        error,
        projectId,
      });
      throw new ApiError(
        500,
        'Database error while fetching project variant stats',
      );
    }
  }
}
