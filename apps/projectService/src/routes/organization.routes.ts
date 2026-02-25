import { IRouter, Router } from 'express';
import {
  createOrganizations,
  assignAdminToOrganizations,
  updateOrganizations,
  getAllOrganizations,
  getOrganizationById,
  deleteOrganization,
  unAssignFromOrganization,
  changeStatus,
  addToOrganization,
} from '../controller/organization.controller.js';
import {
  requireOrgAccess,
  requirePermission,
  validate,
} from '@dam/middlewares';
import {
  createOrgsSchemas,
  assignAdminSchema,
  organizationStatusSchema,
  addedToOrg,
} from '@dam/validations';
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
  .route('/status/:orgId')
  .patch(
    authMiddleware,
    requireSuperAdmin,
    validate(organizationStatusSchema),
    changeStatus,
  );

router
  .route('/addToOrg/:orgId')
  .patch(
    authMiddleware,
    requireOrgAccess,
    requirePermission('manage_org_users'),
    validate(addedToOrg),
    addToOrganization,
  );

export default router;
