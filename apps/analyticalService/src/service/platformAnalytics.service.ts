import { prisma } from '../index.js';
import { Asset } from '@dam/mongodb';
import { getCache, setCache, cacheKey, CACHE_TTL } from '@dam/config';
import type { DateRange } from '@dam/utils';

export const platformAnalyticsService = {
  async getOverview(range: DateRange) {
    const key = cacheKey(
      'platform',
      'overview',
      range.from.toISOString(),
      range.to.toISOString(),
    );
    const cached = await getCache(key);
    if (cached) return cached;

    const [
      totalOrgs,
      activeOrgs,
      totalUsers,
      newUsers,
      totalProjects,
      totalTasks,
      tasksByStatus,
      totalApprovals,
      approvalsByStatus,
      orgStorage,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: range.from, lte: range.to } },
      }),
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.approval.count(),
      prisma.approval.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.organization.aggregate({
        _sum: { storageUsed: true, storageLimit: true },
      }),
    ]);

    const assetStats = await Asset.aggregate([
      {
        $group: {
          _id: '$fileType',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
        },
      },
    ]);

    const data = {
      orgs: { total: totalOrgs, active: activeOrgs },
      users: { total: totalUsers, newInRange: newUsers },
      projects: { total: totalProjects },
      tasks: {
        total: totalTasks,
        byStatus: tasksByStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
      },
      approvals: {
        total: totalApprovals,
        byStatus: approvalsByStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
      },
      storage: {
        usedBytes: Number(orgStorage._sum.storageUsed ?? 0),
        limitBytes: Number(orgStorage._sum.storageLimit ?? 0),
      },
      assets: assetStats.map((s: any) => ({
        fileType: s._id,
        count: s.count,
        totalSize: s.totalSize,
      })),
      range: { from: range.from, to: range.to },
    };

    await setCache(key, data, CACHE_TTL.PLATFORM);
    return data;
  },

  async getOrgsBreakdown(range: DateRange) {
    const key = cacheKey(
      'platform',
      'orgs',
      range.from.toISOString(),
      range.to.toISOString(),
    );
    const cached = await getCache(key);
    if (cached) return cached;

    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        storageUsed: true,
        storageLimit: true,
        _count: { select: { users: true, projects: true } },
      },
    });

    const taskCounts = await prisma.task.groupBy({
      by: ['projectId'],
      _count: { id: true },
    });

    const data = orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status,
      members: org._count.users,
      projects: org._count.projects,
      storageUsed: Number(org.storageUsed),
      storageLimit: Number(org.storageLimit),
      storagePercent:
        org.storageLimit > 0
          ? Math.round(
              (Number(org.storageUsed) / Number(org.storageLimit)) * 100,
            )
          : 0,
    }));

    await setCache(key, data, CACHE_TTL.PLATFORM);
    return data;
  },

  async getActivityTimeline(range: DateRange) {
    const key = cacheKey(
      'platform',
      'activity',
      range.from.toISOString(),
      range.to.toISOString(),
    );
    const cached = await getCache(key);
    if (cached) return cached;

    const logs = await prisma.activityLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: range.from, lte: range.to } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const dailyLogins = await prisma.activityLog.findMany({
      where: {
        action: 'USER_LOGIN',
        createdAt: { gte: range.from, lte: range.to },
      },
      select: { createdAt: true },
    });

    const byDay: Record<string, number> = {};
    for (const log of dailyLogins) {
      const day = log.createdAt.toISOString().split('T')[0];
      if (day) {
        byDay[day] = (byDay[day] ?? 0) + 1;
      }
    }

    const data = {
      byAction: logs.map((l) => ({ action: l.action, count: l._count.id })),
      loginsByDay: Object.entries(byDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      range: { from: range.from, to: range.to },
    };

    await setCache(key, data, CACHE_TTL.PLATFORM);
    return data;
  },
};
