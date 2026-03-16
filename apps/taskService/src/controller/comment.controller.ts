import { RequestHandler } from 'express';
import { CommentService } from '../services/comment.service.js';
import { asyncHandler, ApiResponse } from '@dam/utils';
import { Request, Response } from 'express';

const commentService = new CommentService();

export const createComment: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.id as number;

  const comment = await commentService.createComment(
    req.body,
    userId,
    req.ip,
    req.header('user-agent'),
  );

  res.status(201).json(new ApiResponse(201, comment, 'Comment created'));
});

export const updateComment: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = Number(req.user?.id);

    const updatedComment = await commentService.updateComment(
      String(req.params.commentId),
      req.body.text,
      userId,
      req.ip,
      req.header('user-agent'),
    );

    res
      .status(200)
      .json(new ApiResponse(200, updatedComment, 'Comment updated'));
  },
);

export const getTaskComments: RequestHandler = asyncHandler(
  async (req, res) => {
    const comments = await commentService.getTaskComments(
      Number(req.params.taskId),
    );

    res.json(new ApiResponse(200, comments));
  },
);

export const deleteComment: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.id as number;

  await commentService.deleteComment(String(req.params.commentId), userId);

  res.json(new ApiResponse(200, null, 'Comment deleted'));
});
