import { IRouter, Router } from 'express';
import {
  createOrganizations,
  assignAdminToOrganizations,
} from '../controller/organization.controller.js';
import { validate } from '@dam/middlewares';
import { createOrgsSchemas, assignAdminSchema } from '@dam/validations';
import { requireSuperAdmin, authMiddleware } from '@dam/middlewares';

const router: IRouter = Router();

router
  .route('/create')
  .post(
    authMiddleware,
    requireSuperAdmin,
    validate(createOrgsSchemas),
    createOrganizations,
  );

router
  .route('/assign/:orgId')
  .post(
    authMiddleware,
    requireSuperAdmin,
    validate(assignAdminSchema),
    assignAdminToOrganizations,
  );

export default router;
