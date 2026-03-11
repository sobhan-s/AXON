import { prisma } from '../index.js';
import { Asset } from '@dam/mongodb';
import { getCache, setCache, cacheKey, CACHE_TTL } from '@dam/config';
import type { DateRange } from '@dam/utils';

export const orgAnalyticsService = {
  async getOverview(orgId: number, range: DateRange) {
    const key = cacheKey(
      'org',
      orgId,
      'overview',
      range.from.toISOString(),
      range.to.toISOString(),
    );
    console.log(key);
    const cached = await getCache(key);

    if (cached) {
      console.log(cached)
      return cached;
    }

    const [
      org,
      totalMembers,
      totalProjects,
      activeProjects,
      tasksByStatus,
      pendingApprovals,
      recentActivity,
    ] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          storageUsed: true,
          storageLimit: true,
          name: true,
          status: true,
        },
      }),
      prisma.user.count({ where: { organizationId: orgId } }),
      prisma.project.count({ where: { organizationId: orgId } }),
      prisma.project.count({
        where: { organizationId: orgId, status: 'ACTIVE' },
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: {
          project: { organizationId: orgId },
          createdAt: { gte: range.from, lte: range.to },
        },
        _count: { id: true },
      }),
      prisma.approval.count({
        where: {
          status: 'PENDING',
          task: { project: { organizationId: orgId } },
        },
      }),
      prisma.activityLog.count({
        where: {
          organizationId: orgId,
          createdAt: { gte: range.from, lte: range.to },
        },
      }),
    ]);

    const assetStats = await Asset.aggregate([
      {
        $match: {
          organizationId: orgId,
          createdAt: { $gte: range.from, $lte: range.to },
        },
      },
      {
        $group: {
          _id: '$fileType',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
        },
      },
    ]);

    const data = {
      org: {
        name: org?.name,
        status: org?.status,
        storageUsed: Number(org?.storageUsed ?? 0),
        storageLimit: Number(org?.storageLimit ?? 0),
        storagePercent: org?.storageLimit
          ? Math.round(
              (Number(org.storageUsed) / Number(org.storageLimit)) * 100,
            )
          : 0,
      },
      members: { total: totalMembers },
      projects: { total: totalProjects, active: activeProjects },
      tasks: {
        byStatus: tasksByStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
      },
      approvals: { pending: pendingApprovals },
      activity: { totalActions: recentActivity },
      assets: assetStats.map((s: any) => ({
        fileType: s._id,
        count: s.count,
        totalSize: s.totalSize,
      })),
      range: { from: range.from, to: range.to },
    };

    await setCache(key, data, CACHE_TTL.ORG);
    return data;
  },

  async getStorage(orgId: number, range: DateRange) {
    const key = cacheKey(
      'org',
      orgId,
      'storage',
      range.from.toISOString(),
      range.to.toISOString(),
    );

    console.log(key);
    const cached = await getCache(key);

    if (cached) {
      console.log('-------------');
      return cached;
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { storageUsed: true, storageLimit: true },
    });

    const byProject = await Asset.aggregate([
      { $match: { organizationId: orgId } },
      {
        $group: {
          _id: '$projectId',
          totalSize: { $sum: '$fileSize' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalSize: -1 } },
    ]);

    const byFileType = await Asset.aggregate([
      { $match: { organizationId: orgId } },
      {
        $group: {
          _id: '$fileType',
          totalSize: { $sum: '$fileSize' },
          count: { $sum: 1 },
        },
      },
    ]);

    const uploadTrend = await Asset.aggregate([
      {
        $match: {
          organizationId: orgId,
          createdAt: { $gte: range.from, $lte: range.to },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSize: { $sum: '$fileSize' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = {
      storage: {
        usedBytes: Number(org?.storageUsed ?? 0),
        limitBytes: Number(org?.storageLimit ?? 0),
        remainingBytes: Number(
          (org?.storageLimit ?? 0n) - (org?.storageUsed ?? 0n),
        ),
        percent: org?.storageLimit
          ? Math.round(
              (Number(org.storageUsed) / Number(org.storageLimit)) * 100,
            )
          : 0,
      },
      byProject: byProject.map((p: any) => ({
        projectId: p._id,
        totalSize: p.totalSize,
        count: p.count,
      })),
      byFileType: byFileType.map((f: any) => ({
        fileType: f._id,
        totalSize: f.totalSize,
        count: f.count,
      })),
      uploadTrend: uploadTrend.map((t: any) => ({
        date: t._id,
        totalSize: t.totalSize,
        count: t.count,
      })),
      range: { from: range.from, to: range.to },
    };

    await setCache(key, data, CACHE_TTL.ORG);
    return data;
  },

  async getUsers(orgId: number, range: DateRange) {
    const key = cacheKey(
      'org',
      orgId,
      'users',
      range.from.toISOString(),
      range.to.toISOString(),
    );
    const cached = await getCache(key);
    if (cached) return cached;

    const members = await prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        lastLoginAt: true,
        assignedTasks: {
          where: { createdAt: { gte: range.from, lte: range.to } },
          select: { status: true },
        },
        timeLogs: {
          where: { loggedAt: { gte: range.from, lte: range.to } },
          select: { hours: true },
        },
        reviewedApprovals: {
          where: { reviewedAt: { gte: range.from, lte: range.to } },
          select: { status: true },
        },
      },
    });

    const assetsByUser = await Asset.aggregate([
      {
        $match: {
          organizationId: orgId,
          createdAt: { $gte: range.from, $lte: range.to },
        },
      },
      {
        $group: {
          _id: '$uploadedBy',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
        },
      },
    ]);
    const assetMap = Object.fromEntries(
      assetsByUser.map((a: any) => [
        a._id,
        { count: a.count, totalSize: a.totalSize },
      ]),
    );

    const data = members.map((m) => {
      const totalHours = m.timeLogs.reduce(
        (sum, t) => sum + Number(t.hours),
        0,
      );
      const tasksCompleted = m.assignedTasks.filter(
        (t) => t.status === 'DONE',
      ).length;
      const approved = m.reviewedApprovals.filter(
        (a) => a.status === 'APPROVED',
      ).length;
      const rejected = m.reviewedApprovals.filter(
        (a) => a.status === 'REJECTED',
      ).length;
      const assets = assetMap[m.id] ?? { count: 0, totalSize: 0 };

      return {
        id: m.id,
        username: m.username,
        email: m.email,
        lastLoginAt: m.lastLoginAt,
        tasksAssigned: m.assignedTasks.length,
        tasksCompleted,
        hoursLogged: Math.round(totalHours * 100) / 100,
        assetsUploaded: assets.count,
        reviewsDone: m.reviewedApprovals.length,
        approvalRate:
          m.reviewedApprovals.length > 0
            ? Math.round((approved / m.reviewedApprovals.length) * 100)
            : null,
      };
    });

    await setCache(key, data, CACHE_TTL.ORG);
    return data;
  },

  async getActivity(orgId: number, range: DateRange) {
    const key = cacheKey(
      'org',
      orgId,
      'activity',
      range.from.toISOString(),
      range.to.toISOString(),
    );
    const cached = await getCache(key);
    if (cached) return cached;

    const [byAction, recent] = await Promise.all([
      prisma.activityLog.groupBy({
        by: ['action'],
        where: {
          organizationId: orgId,
          createdAt: { gte: range.from, lte: range.to },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.activityLog.findMany({
        where: {
          organizationId: orgId,
          createdAt: { gte: range.from, lte: range.to },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { username: true } } },
      }),
    ]);

    const data = {
      byAction: byAction.map((a) => ({ action: a.action, count: a._count.id })),
      recent: recent.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        user: l.user?.username,
        createdAt: l.createdAt,
      })),
      range: { from: range.from, to: range.to },
    };

    await setCache(key, data, CACHE_TTL.ORG);
    return data;
  },
};
