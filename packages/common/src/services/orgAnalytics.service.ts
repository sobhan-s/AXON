import { getCache, setCache, cacheKey, CACHE_TTL } from '@dam/config';
import { OrgAnalyticsRepository } from '@dam/repository';
import { ApiError, type DateRange } from '@dam/utils';

export class OrgDashboardService {
  private orgAnalyticalRepo: OrgAnalyticsRepository;

  constructor() {
    this.orgAnalyticalRepo = new OrgAnalyticsRepository();
  }
  async getDashboard(orgId: number, range: DateRange) {
    const key = cacheKey(
      'org-dashboard',
      orgId,
      range.from.toISOString(),
      range.to.toISOString(),
    );

    const cached = await getCache(key);
    if (cached) return cached;

    const [prismaStats, assetStats] = await Promise.all([
      this.orgAnalyticalRepo.getStats(orgId, range),
      this.orgAnalyticalRepo.getAssetStats(orgId, range),
    ]);

    const {
      org,
      totalMembers,
      projectList,
      tasksByStatus,
      tasksByPriority,
      approvals,
      recentActivity,
      timeLogs,
      memberList,
    } = prismaStats;

    const hoursByDay: Record<string, number> = {};
    const hoursByMember: Record<number, { username: string; hours: number }> =
      {};

    for (const log of timeLogs) {
      const day = log.loggedAt.toISOString().split('T')[0];
      if (!day) {
        throw new ApiError(404, 'Day is not found');
      }
      hoursByDay[day] = (hoursByDay[day] ?? 0) + Number(log.hours);
      hoursByMember[log.user.id] ??= { username: log.user.username, hours: 0 };
      hoursByMember[log.user.id]!.hours += Number(log.hours);
    }

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

    const data = {
      overview: {
        name: org?.name,
        status: org?.status,
        members: totalMembers,
        projects: projectList.length,
        activeProjects: projectList.filter((p) => p.status === 'ACTIVE').length,
        tasks: tasksByStatus.reduce((s, t) => s + t._count.id, 0),
        assets: {
          total: assetStats.totals[0]?.count ?? 0,
          totalSize: assetStats.totals[0]?.totalSize ?? 0,
        },
        storage: {
          usedBytes: Number(org?.storageUsed ?? 0),
          limitBytes: Number(org?.storageLimit ?? 0),
          percent: org?.storageLimit
            ? Math.round(
                (Number(org.storageUsed) / Number(org.storageLimit)) * 100,
              )
            : 0,
        },
        hoursLogged:
          Math.round(timeLogs.reduce((s, l) => s + Number(l.hours), 0) * 100) /
          100,
      },
      projects: projectList.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        tasks: p._count.tasks,
        members: p._count.teamMembers,
        startDate: p.startDate,
        endDate: p.endDate,
        storage: assetStats.storageByProject.find(
          (s: any) => s._id === p.id,
        ) ?? { totalSize: 0, count: 0 },
      })),
      tasks: {
        byStatus: tasksByStatus.map((t) => ({
          status: t.status,
          count: t._count.id,
        })),
        byPriority: tasksByPriority.map((t) => ({
          priority: t.priority,
          count: t._count.id,
        })),
      },
      approvals: {
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
      },
      members: memberList.map((m) => ({
        id: m.id,
        username: m.username,
        avatarUrl: m.avatarUrl,
        lastLoginAt: m.lastLoginAt,
        tasksAssigned: m.assignedTasks.length,
        tasksDone: m.assignedTasks.filter((t) => t.status === 'DONE').length,
        hoursLogged:
          Math.round(
            m.timeLogs.reduce((s, l) => s + Number(l.hours), 0) * 100,
          ) / 100,
      })),
      assets: {
        byType: assetStats.byType.map((a: any) => ({
          fileType: a._id,
          count: a.count,
          totalSize: a.totalSize,
        })),
        finalized: assetStats.finalized.map((f: any) => ({
          fileType: f._id,
          count: f.count,
        })),
        uploadsByDay: assetStats.uploadsByDay.map((d: any) => ({
          date: d._id,
          count: d.count,
          totalSize: d.totalSize,
        })),
        storageByProject: assetStats.storageByProject.map((s: any) => ({
          projectId: s._id,
          totalSize: s.totalSize,
          count: s.count,
        })),
      },
      timeLogs: {
        totalHours:
          Math.round(timeLogs.reduce((s, l) => s + Number(l.hours), 0) * 100) /
          100,
        byDay: Object.entries(hoursByDay)
          .map(([date, hours]) => ({
            date,
            hours: Math.round(hours * 100) / 100,
          }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        byMember: Object.values(hoursByMember).sort(
          (a, b) => b.hours - a.hours,
        ),
      },
      activity: {
        recent: recentActivity.map((l) => ({
          id: l.id,
          action: l.action,
          entityType: l.entityType,
          user: l.user ? { id: l.user.id, username: l.user.username } : null,
          createdAt: l.createdAt,
        })),
      },
      range: { from: range.from, to: range.to },
    };

    await setCache(key, data, CACHE_TTL.ORG);
    return data;
  }
}
