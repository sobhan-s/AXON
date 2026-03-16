import { Comment } from '@dam/mongodb';
import { Types } from 'mongoose';
import { logger } from '@dam/config';
import { ApiError } from '@dam/utils';

export class CommentRepository {
  async createComment(data: {
    taskId: number;
    assetId?: string;
    userId: number;
    text: string;
    mentions?: number[];
  }) {
    try {
      return await Comment.create(data);
    } catch (error) {
      logger.error('Error creating comment', { error, data });
      throw new ApiError(500, 'Failed to create comment');
    }
  }

  async updateComment(commentId: string, text: string) {
    try {
      return await Comment.findByIdAndUpdate(
        commentId,
        {
          text,
          isEdited: true,
          editedAt: new Date(),
        },
        { new: true },
      );
    } catch (error) {
      logger.error('Error updating comment', { error, commentId });
      throw new ApiError(500, 'Failed to update comment');
    }
  }

  async findByTask(taskId: number) {
    try {
      return await Comment.find({
        taskId,
        deletedAt: null,
      }).sort({ createdAt: 1 });
    } catch (error) {
      logger.error('Error fetching task comments', { error, taskId });
      throw new ApiError(500, 'Failed to fetch comments');
    }
  }

  async findByAsset(assetId: Types.ObjectId) {
    try {
      return await Comment.find({
        assetId,
        deletedAt: null,
      }).sort({ createdAt: 1 });
    } catch (error) {
      logger.error('Error fetching asset comments', { error, assetId });
      throw new ApiError(500, 'Failed to fetch comments');
    }
  }

  async findById(commentId: string) {
    try {
      return await Comment.findById(commentId);
    } catch (error) {
      logger.error('Error finding comment', { error, commentId });
      throw new ApiError(500, 'Failed to fetch comment');
    }
  }

  async softDelete(commentId: string) {
    try {
      return await Comment.findByIdAndUpdate(
        commentId,
        { deletedAt: new Date() },
        { new: true },
      );
    } catch (error) {
      logger.error('Error deleting comment', { error, commentId });
      throw new ApiError(500, 'Failed to delete comment');
    }
  }
}
