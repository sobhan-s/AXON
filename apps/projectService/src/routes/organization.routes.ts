import { IRouter, Router } from 'express';
import {
  createOrganizations,
  assignAdminToOrganizations,
  updateOrganizations,
  getAllOrganizations,
  getOrganizationById,
  deleteOrganization,
  unAssignFromOrganization,
  changeAssignOfOrganization,
} from '../controller/organization.controller.js';
import { validate } from '@dam/middlewares';
import { createOrgsSchemas, assignAdminSchema } from '@dam/validations';
import { requireSuperAdmin, authMiddleware } from '@dam/middlewares';
import { updateOrgsSchema } from '@dam/validations';

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

router
  .route('/update/:orgId')
  .put(
    authMiddleware,
    requireSuperAdmin,
    validate(updateOrgsSchema),
    updateOrganizations,
  );

router
  .route('/allOrg')
  .get(authMiddleware, requireSuperAdmin, getAllOrganizations);

router
  .route('/getOrgById/:orgId')
  .get(authMiddleware, requireSuperAdmin, getOrganizationById);

router
  .route('/deleteOrg/:orgId')
  .delete(authMiddleware, requireSuperAdmin, deleteOrganization);

router
  .route('/unAssign/:orgId')
  .patch(authMiddleware, requireSuperAdmin, unAssignFromOrganization);

router
  .route('/changeAssign/:orgId')
  .patch(
    authMiddleware,
    requireSuperAdmin,
    validate(assignAdminSchema),
    changeAssignOfOrganization
  );

export default router;
