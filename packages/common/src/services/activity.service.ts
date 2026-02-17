import {
  PrismaClient,
  PostgresClient as prisma,
  ActivityAction,
} from '@dam/postgresql_db';
import { logger } from '@dam/config';

export interface ActivityPayload {
  userId?: number;
  organizationId?: number;
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class ActivityService {
  async logActivity(payload: ActivityPayload) {
    try {
      await prisma.activityLog.create({
        data: {
          userId: payload.userId,
          organizationId: payload.organizationId,
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId,
          details: payload.details,
          ipAddress: payload.ipAddress,
          userAgent: payload.userAgent,
        },
      });

      logger.info('Activity logged', {
        action: payload.action,
        userId: payload.userId,
      });
    } catch (error) {
      logger.error('Failed to log activity', { error });
    }
  }
}
