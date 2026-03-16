import { CommentRepository } from '@dam/repository';
import { ActivityService } from '@dam/common';
import { ApiError } from '@dam/utils';
import { logger } from '@dam/config';

export class CommentService {
  private commentRepo: CommentRepository;
  private activitySvc: ActivityService;

  constructor() {
    this.commentRepo = new CommentRepository();
    this.activitySvc = new ActivityService();
  }

  async createComment(
    data: {
      taskId: number;
      assetId?: string;
      text: string;
      mentions?: number[];
    },
    userId: number,
    ip?: string,
    userAgent?: string,
  ) {
    logger.info('Creating comment', { userId });

    const comment = await this.commentRepo.createComment({
      ...data,
      userId,
    });

    await this.activitySvc.logActivity({
      userId,
      action: 'COMMENT_CREATED',
      entityType: 'COMMENT',
      entityId: comment._id.toString(),
      details: { text: comment.text },
      ipAddress: ip,
      userAgent,
    });

    return comment;
  }

  async updateComment(
    commentId: string,
    text: string,
    userId: number,
    ip?: string,
    userAgent?: string,
  ) {
    logger.info('Updating comment', { commentId, userId });

    const comment = await this.commentRepo.findById(commentId);

    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ApiError(403, 'Not allowed to edit this comment');
    }

    const updated = await this.commentRepo.updateComment(commentId, text);

    await this.activitySvc.logActivity({
      userId,
      action: 'COMMENT_UPDATED',
      entityType: 'COMMENT',
      entityId: commentId,
      details: { text },
      ipAddress: ip,
      userAgent,
    });

    return updated;
  }

  async getTaskComments(taskId: number) {
    return this.commentRepo.findByTask(taskId);
  }

  async getAssetComments(assetId: string) {
    return this.commentRepo.findByAsset(assetId as any);
  }

  async deleteComment(commentId: string, userId: number) {
    const comment = await this.commentRepo.findById(commentId);

    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ApiError(403, 'Not allowed to delete this comment');
    }

    return this.commentRepo.softDelete(commentId);
  }
}
