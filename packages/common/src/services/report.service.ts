import { rabbitPublish, QUEUES } from '@dam/config';
import { logger } from '@dam/config';
import { ApiError } from '@dam/utils';
import type { DateRange } from '@dam/utils';

interface ReportPayload {
  scope: 'platform' | 'org' | 'project';
  scopeId?: number;
  range: DateRange;
  requestedBy: number;
  email: string;
}

export class ReportService {
  async generatePlatformReport(
    payload: Omit<ReportPayload, 'scope' | 'scopeId'>,
  ) {
    return this.publish({ ...payload, scope: 'platform' });
  }

  async generateOrgReport(
    orgId: number,
    payload: Omit<ReportPayload, 'scope' | 'scopeId'>,
  ) {
    return this.publish({ ...payload, scope: 'org', scopeId: orgId });
  }

  async generateProjectReport(
    projectId: number,
    payload: Omit<ReportPayload, 'scope' | 'scopeId'>,
  ) {
    return this.publish({
      ...payload,
      scope: 'project',
      scopeId: projectId,
    });
  }

  publish(payload: ReportPayload) {
    const { scope, scopeId, range, requestedBy, email } = payload;

    if (!email) {
      throw new ApiError(400, 'email is required to generate a report');
    }

    if ((scope === 'org' || scope === 'project') && !scopeId) {
      throw new ApiError(400, `scopeId is required for scope "${scope}"`);
    }

    rabbitPublish(QUEUES.REPORT_GENERATE, {
      scope,
      scopeId,
      requestedBy,
      email,
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
    });

    logger.info('Report job queued', { scope, scopeId, requestedBy, email });

    return {
      message: `Report is being generated and will be sent to ${email}`,
    };
  }
}
