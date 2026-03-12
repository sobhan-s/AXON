import { getCache, setCache, cacheKey, CACHE_TTL } from '@dam/config';
import { ProjectAnalyticsRepository } from '@dam/repository';
import { ApiError, type DateRange } from '@dam/utils';

export class ProjectDashboardService {
  private projectAnalyticalRepo: ProjectAnalyticsRepository;

  constructor() {
    this.projectAnalyticalRepo = new ProjectAnalyticsRepository();
  }
  async getDashboard(projectId: number, range: DateRange) {
    const key = cacheKey(
      'project-dashboard',
      projectId,
      range.from.toISOString(),
      range.to.toISOString(),
    );

    const cached = await getCache(key);
    if (cached) return cached;

    const [prismaStats, assetStats, variantStats] = await Promise.all([
      this.projectAnalyticalRepo.getStats(projectId, range),
      this.projectAnalyticalRepo.getAssetStats(projectId, range),
      this.projectAnalyticalRepo.getVariantStats(projectId),
    ]);

    const {
      project,
      allTasks,
      approvals,
      timeLogs,
      teamMembers,
      recentActivity,
    } = prismaStats;

    const now = new Date();

    const taskSummary = {
      total: allTasks.length,
      byStatus: {
        TODO: allTasks.filter((t) => t.status === 'TODO').length,
        IN_PROGRESS: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
        REVIEW: allTasks.filter((t) => t.status === 'REVIEW').length,
        APPROVED: allTasks.filter((t) => t.status === 'APPROVED').length,
        FAILED: allTasks.filter((t) => t.status === 'FAILED').length,
        DONE: allTasks.filter((t) => t.status === 'DONE').length,
      },
      byPriority: {
        LOW: allTasks.filter((t) => t.priority === 'LOW').length,
        MEDIUM: allTasks.filter((t) => t.priority === 'MEDIUM').length,
        HIGH: allTasks.filter((t) => t.priority === 'HIGH').length,
        URGENT: allTasks.filter((t) => t.priority === 'URGENT').length,
      },
      byType: {
        MANUAL: allTasks.filter((t) => t.taskType === 'MANUAL').length,
        ASSET_BASED: allTasks.filter((t) => t.taskType === 'ASSET_BASED')
          .length,
      },
      overdue: allTasks.filter(
        (t) =>
          t.dueDate &&
          t.dueDate < now &&
          !['DONE', 'APPROVED'].includes(t.status),
      ).length,
      completionRate:
        allTasks.length > 0
          ? Math.round(
              (allTasks.filter((t) => t.status === 'DONE').length /
                allTasks.length) *
                100,
            )
          : 0,
    };

    const totalApprovals = approvals.length;
    const approvedCount = approvals.filter(
      (a) => a.status === 'APPROVED',
    ).length;
    const reviewedApprovals = approvals.filter((a) => a.reviewedAt);
    const avgReviewMs = reviewedApprovals.length
      ? reviewedApprovals.reduce(
          (s, a) => s + (a.reviewedAt!.getTime() - a.requestedAt.getTime()),
          0,
        ) / reviewedApprovals.length
      : null;

    const approvalSummary = {
      total: totalApprovals,
      pending: approvals.filter((a) => a.status === 'PENDING').length,
      approved: approvedCount,
      rejected: approvals.filter((a) => a.status === 'REJECTED').length,
      approvalRate:
        totalApprovals > 0
          ? Math.round((approvedCount / totalApprovals) * 100)
          : null,
      avgReviewHours: avgReviewMs
        ? Math.round((avgReviewMs / 3600000) * 10) / 10
        : null,
      recent: approvals.slice(0, 5),
    };

    const hoursByMember: Record<
      number,
      { username: string; hours: number; avatarUrl?: string | null }
    > = {};
    const hoursByTask: Record<number, { title: string; hours: number }> = {};
    const hoursByDay: Record<string, number> = {};

    for (const log of timeLogs) {
      hoursByMember[log.user.id] ??= {
        username: log.user.username,
        hours: 0,
        avatarUrl: log.user.avatarUrl,
      };
      hoursByMember[log.user.id]!.hours += Number(log.hours);

      hoursByTask[log.task.id] ??= { title: log.task.title, hours: 0 };
      hoursByTask[log.task.id]!.hours += Number(log.hours);

      const day = log.loggedAt.toISOString().split('T')[0];
      if (!day) {
        throw new ApiError(404, 'Day is not found');
      }
      hoursByDay[day] = (hoursByDay[day] ?? 0) + Number(log.hours);
    }

    const timeLogSummary = {
      totalHours:
        Math.round(timeLogs.reduce((s, l) => s + Number(l.hours), 0) * 100) /
        100,
      estimatedHours: allTasks.reduce(
        (s, t) => s + Number(t.estimatedHours ?? 0),
        0,
      ),
      byMember: Object.values(hoursByMember).sort((a, b) => b.hours - a.hours),
      byTask: Object.values(hoursByTask)
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 10),
      byDay: Object.entries(hoursByDay)
        .map(([date, hours]) => ({
          date,
          hours: Math.round(hours * 100) / 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };

    const tasksByMember = allTasks.reduce<
      Record<number, { total: number; done: number; inProgress: number }>
    >((acc, task) => {
      if (!task.assignedTo) return acc;
      const uid = task.assignedTo.id;
      acc[uid] ??= { total: 0, done: 0, inProgress: 0 };
      acc[uid].total++;
      if (task.status === 'DONE') acc[uid].done++;
      if (task.status === 'IN_PROGRESS') acc[uid].inProgress++;
      return acc;
    }, {});

    const assetByUploaderMap = Object.fromEntries(
      assetStats.byUploader.map((a: any) => [a._id, a.count]),
    );

    const members = teamMembers.map(({ user, role, addedAt }) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: role.name,
      roleLevel: role.level,
      addedAt,
      lastLoginAt: user.lastLoginAt,
      tasks: tasksByMember[user.id] ?? { total: 0, done: 0, inProgress: 0 },
      hoursLogged: Math.round((hoursByMember[user.id]?.hours ?? 0) * 100) / 100,
      assetsUploaded: assetByUploaderMap[user.id] ?? 0,
    }));

    const finalizedTotal = assetStats.finalized.reduce(
      (s: number, f: any) => s + f.count,
      0,
    );

    const assetSummary = {
      total: assetStats.totals[0]?.count ?? 0,
      totalSize: assetStats.totals[0]?.totalSize ?? 0,
      avgSize: assetStats.totals[0]?.avgSize ?? 0,
      finalized: {
        total: finalizedTotal,
        byType: assetStats.finalized.map((f: any) => ({
          fileType: f._id,
          count: f.count,
        })),
      },
      byType: assetStats.byType.map((a: any) => ({
        fileType: a._id,
        count: a.count,
        totalSize: a.totalSize,
      })),
      byStatus: assetStats.byStatus.map((a: any) => ({
        status: a._id,
        count: a.count,
      })),
      byProcessingStatus: assetStats.byProcessingStatus.map((a: any) => ({
        status: a._id,
        count: a.count,
      })),
      variants: {
        total: variantStats.total[0]?.count ?? 0,
        byType: variantStats.byType.map((v: any) => ({
          variantType: v._id,
          count: v.count,
        })),
      },
      recentUploads: assetStats.recentUploads,
      uploadsByDay: assetStats.uploadsByDay.map((d: any) => ({
        date: d._id,
        count: d.count,
        totalSize: d.totalSize,
      })),
    };

    const data = {
      project,
      tasks: taskSummary,
      approvals: approvalSummary,
      timeLogs: timeLogSummary,
      members,
      assets: assetSummary,
      activity: recentActivity.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        details: l.details,
        user: l.user
          ? {
              id: l.user.id,
              username: l.user.username,
              avatarUrl: l.user.avatarUrl,
            }
          : null,
        createdAt: l.createdAt,
      })),
      range: { from: range.from, to: range.to },
    };

    await setCache(key, data, CACHE_TTL.PROJECT);
    return data;
  }
}
