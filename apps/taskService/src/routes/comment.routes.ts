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

router.route('/:projectId/create').post(requireProjectAccess,createComment);

router.route('/:projectId/task/:taskId').get(getTaskComments);

router
  .route('/:projectId/:commentId')
  .patch(updateComment)
  .delete(deleteComment);

export default router;
