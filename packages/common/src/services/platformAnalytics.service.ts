import { getCache, setCache, cacheKey, CACHE_TTL } from '@dam/config';
import { PlatformAnalyticsRepository } from '@dam/repository';
import type { DateRange } from '@dam/utils';

export class PlatformDashboardService {
  private platformRepo: PlatformAnalyticsRepository;

  constructor() {
    this.platformRepo = new PlatformAnalyticsRepository();
  }

  async getDashboard(range: DateRange) {
    const key = cacheKey(
      'platform-dashboard',
      range.from.toISOString(),
      range.to.toISOString(),
    );

    const cached = await getCache(key);
    if (cached) return cached;

    const [prismaStats, assetStats] = await Promise.all([
      this.platformRepo.getStats(range),
      this.platformRepo.getAssetStats(range),
    ]);

    const {
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
    } = prismaStats;

    const activityByAction: Record<string, number> = {};
    for (const log of recentActivity) {
      activityByAction[log.action] = (activityByAction[log.action] ?? 0) + 1;
    }

    const data = {
      overview: {
        orgs: { total: totalOrgs, active: activeOrgs },
        users: { total: totalUsers, newInRange: newUsers },
        projects: { total: totalProjects, active: activeProjects },
        tasks: { total: tasksByStatus.reduce((s, t) => s + t._count.id, 0) },
        assets: {
          total: assetStats.totals[0]?.count ?? 0,
          totalSize: assetStats.totals[0]?.totalSize ?? 0,
        },
        storage: {
          usedBytes: Number(orgStorage._sum.storageUsed ?? 0),
          limitBytes: Number(orgStorage._sum.storageLimit ?? 0),
        },
        hoursLogged:
          Math.round(Number(timeLogTotal._sum.hours ?? 0) * 100) / 100,
      },
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
        byStatus: approvalsByStatus.map((a) => ({
          status: a.status,
          count: a._count.id,
        })),
      },
      orgs: orgList.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        status: o.status,
        members: o._count.users,
        projects: o._count.projects,
        storageUsed: Number(o.storageUsed),
        storageLimit: Number(o.storageLimit),
        storagePercent:
          o.storageLimit > 0
            ? Math.round((Number(o.storageUsed) / Number(o.storageLimit)) * 100)
            : 0,
      })),
      assets: {
        byType: assetStats.byType.map((a: any) => ({
          fileType: a._id,
          count: a.count,
          totalSize: a.totalSize,
        })),
        uploadsByDay: assetStats.uploadsByDay.map((d: any) => ({
          date: d._id,
          count: d.count,
          totalSize: d.totalSize,
        })),
      },
      activity: {
        byAction: Object.entries(activityByAction)
          .map(([action, count]) => ({ action, count }))
          .sort((a, b) => b.count - a.count),
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

    await setCache(key, data, CACHE_TTL.PLATFORM);
    return data;
  }
}
