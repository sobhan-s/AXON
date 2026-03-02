import { Router, IRouter } from 'express';
import {
  authMiddleware,
  requireOrgAccess,
  requirePermission,
  requireProjectAccess,
  validate,
} from '@dam/middlewares';
import {
  createManualTaskSchema,
  updateTaskSchema,
  changeStatusSchema,
  assignTaskSchema,
  bulkAssignSchema,
  bulkStatusSchema,
  bulkDeleteSchema,
} from '@dam/validations';
import {
  createManualTask,
  getProjectTasks,
  getTaskById,
  getMyTasks,
  getOverdueTasks,
  getMyOverdueTasks,
  updateTask,
  changeStatus,
  assignTask,
  deleteTask,
  bulkAssign,
  bulkChangeStatus,
  bulkDelete,
  getApprovals,
  getTimeLogs,
  deleteTimeLog,
} from '../controller/task.controller.js';

const router: IRouter = Router();
router.use(authMiddleware);

router.get('/my/:projectId', requireProjectAccess, getMyTasks);
router.get('/my/overdue/:projectId', requireProjectAccess, getMyOverdueTasks);

router.get(
  '/getProjectTasks/project/:projectId',
  requireProjectAccess,
  getProjectTasks,
);
router.get(
  '/overdueTasks/project/:projectId',
  requireProjectAccess,
  requirePermission('delete_asset'),
  getOverdueTasks,
);
router.post(
  '/createTask/project/:projectId',
  requireProjectAccess,
  requirePermission('create_task'),
  validate(createManualTaskSchema),
  createManualTask,
);

router
  .route('/getTaskById/:projectId/:taskId')
  .get(requireProjectAccess, getTaskById);

router
  .route('/updateTask/:projectId/:taskId')
  .put(
    requireProjectAccess,
    requirePermission('update_task'),
    validate(updateTaskSchema),
    updateTask,
  );

router.route('/deleteTask/:taskId').delete(deleteTask);

router.patch(
  '/status/:projectId/:taskId',
  requireProjectAccess,
  validate(changeStatusSchema),
  changeStatus,
);

router.patch(
  '/assign/:projectId/:taskId',
  requireProjectAccess,
  validate(assignTaskSchema),
  assignTask,
);

// Bulk operations 
router.patch(
  '/bulk/assign/:projectId',
  requireProjectAccess,
  validate(bulkAssignSchema),
  bulkAssign,
);
router.patch(
  '/bulk/status',
  requireProjectAccess,
  validate(bulkStatusSchema),
  bulkChangeStatus,
);
router.delete(
  '/bulk/delete/:projectId',
  requireProjectAccess,
  validate(bulkDeleteSchema),
  bulkDelete,
);

// approvals
router.get('/:taskId/approvals', getApprovals);

// timelogs
router.get('/:taskId/timelogs', getTimeLogs);
router.delete('/:taskId/timelogs/:timeLogId', deleteTimeLog);

export default router;
