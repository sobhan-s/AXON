import {
  createProject,
  getAllProjects,
  getMyProjects,
  updateProject,
} from '../controller/project.controller.js';
import { type IRouter, Router } from 'express';
import { createProjectsSchemas, updateProjectSchema } from '@dam/validations';
import {
  authMiddleware,
  requireOrgAccess,
  requirePermission,
  requireProjectAccess,
  validate,
} from '@dam/middlewares';

const router: IRouter = Router();

router
  .route('/:orgId/create')
  .post(
    authMiddleware,
    requireOrgAccess,
    requirePermission('create_project'),
    validate(createProjectsSchemas),
    createProject,
  );

router.get('/:orgId/all', authMiddleware, requireOrgAccess, getAllProjects);

// user level , all project i am member of
router.get('/my-projects', authMiddleware, getMyProjects);

router.put(
  '/:projectId',
  authMiddleware,
  requireProjectAccess,
  requirePermission('update_project'),
  validate(updateProjectSchema),
  updateProject,
);

export default router;
