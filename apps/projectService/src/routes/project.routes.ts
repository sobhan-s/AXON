import { createProject } from '../controller/project.controller.js';
import { type IRouter, Router } from 'express';
import { createProjectsSchemas } from '@dam/validations';
import {
  authMiddleware,
  requireOrgAccess,
  requirePermission,
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

export default router;
