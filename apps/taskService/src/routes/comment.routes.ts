import { IRouter, Router } from 'express';
import {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
} from '../controller/comment.controller.js';
import { authMiddleware, requireProjectAccess } from '@dam/middlewares';

const router: IRouter = Router();

router.use(authMiddleware);
// router.use(requireProjectAccess);

// Create a comment for a specific project
router.route('/:projectId/create').post(requireProjectAccess, createComment);

// Get all comments for a specific task within a project
router
  .route('/:projectId/task/:taskId')
  .get(requireProjectAccess, getTaskComments);

// Update or delete a specific comment
router
  .route('/:projectId/:commentId')
  .patch(requireProjectAccess, updateComment)
  .delete(requireProjectAccess, deleteComment);

export default router;
