import {
  PlatformDashboardService,
  OrgDashboardService,
  ProjectDashboardService,
} from '@dam/common';

const platformDashboardService = new PlatformDashboardService();
const orgDashboardService = new OrgDashboardService();
const projectDashboardService = new ProjectDashboardService();

export async function fetchDashboardData(
  scope: 'platform' | 'org' | 'project',
  scopeId: number | undefined,
  dateRange: { from: Date; to: Date },
): Promise<any> {
  if (scope === 'platform') {
    return platformDashboardService.getDashboard(dateRange);
  }
  if (scope === 'org' && scopeId) {
    return orgDashboardService.getDashboard(scopeId, dateRange);
  }
  if (scope === 'project' && scopeId) {
    return projectDashboardService.getDashboard(scopeId, dateRange);
  }
  throw new Error(`Invalid scope/scopeId: ${scope}/${scopeId}`);
}
