import { logger } from '@dam/config';
import { prisma } from '../index.js';
import { ApiError } from '@dam/utils';

export class ApprovalRepository {
  async createApproval(
    taskId: number,
    requestedById: number,
    assetId: string,
    comments?: string,
  ) {
    try {
      return await prisma.approval.create({
        data: { taskId, requestedById, assetId, comments },
        include: {
          requestedBy: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      });
    } catch (error) {
      logger.error('Error creating approval', { error });
      throw new ApiError(500, 'Failed to create approval');
    }
  }

  async findApprovalById(approvalId: number) {
    try {
      return await prisma.approval.findUnique({
        where: { id: approvalId },
        include: {
          requestedBy: { select: { id: true, username: true } },
          reviewedBy: { select: { id: true, username: true } },
          task: {
            select: { id: true, status: true, projectId: true, taskType: true },
          },
        },
      });
    } catch (error) {
      logger.error('Error finding approval', { error });
      throw new ApiError(500, 'Failed to find approval');
    }
  }

  async findApprovalsByTask(taskId: number) {
    try {
      return await prisma.approval.findMany({
        where: { taskId },
        include: {
          requestedBy: {
            select: { id: true, username: true, avatarUrl: true },
          },
          reviewedBy: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { requestedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error finding approvals', { error });
      throw new ApiError(500, 'Failed to fetch approvals');
    }
  }

  async getPendingApproval(taskId: number) {
    try {
      return await prisma.approval.findFirst({
        where: { taskId, status: 'PENDING' },
      });
    } catch (error) {
      logger.error('Error finding pending approval', { error });
      throw new ApiError(500, 'Failed to find pending approval');
    }
  }

  async reviewApproval(
    approvalId: number,
    reviewedById: number,
    status: 'APPROVED' | 'REJECTED',
    comments?: string,
  ) {
    try {
      return await prisma.approval.update({
        where: { id: approvalId },
        data: {
          reviewedById,
          status: status,
          comments,
          reviewedAt: new Date(),
        },
        include: {
          requestedBy: { select: { id: true, username: true } },
          reviewedBy: { select: { id: true, username: true } },
        },
      });
    } catch (error) {
      logger.error('Error reviewing approval', { error });
      throw new ApiError(500, 'Failed to review approval');
    }
  }
}
