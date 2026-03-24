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
  requestCreationForOrganizations,
  handletOrgRequestDecission,
  pendinOrgnizationRequest,
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

/* Create a new organization (Super Admin only) */
router
  .route('/create')
  .post(
    authMiddleware,
    requireSuperAdmin,
    validate(createOrgsSchemas),
    createOrganizations,
  );

/* Assign an admin to an organization (Super Admin only) */
router
  .route('/assign/:orgId')
  .post(
    authMiddleware,
    requireSuperAdmin,
    validate(assignAdminSchema),
    assignAdminToOrganizations,
  );

/* Update organization details (Super Admin only) */
router
  .route('/update/:orgId')
  .put(
    authMiddleware,
    requireSuperAdmin,
    validate(updateOrgsSchema),
    updateOrganizations,
  );

/* Fetch all organizations (Super Admin only) */
router
  .route('/allOrg')
  .get(authMiddleware, requireSuperAdmin, getAllOrganizations);

/* Fetch organization by ID (Super Admin only) */
router
  .route('/getOrgById/:orgId')
  .get(authMiddleware, requireSuperAdmin, getOrganizationById);

/* Delete an organization (Super Admin only) */
router
  .route('/deleteOrg/:orgId')
  .delete(authMiddleware, requireSuperAdmin, deleteOrganization);

/* Unassign admin from an organization (Super Admin only) */
router
  .route('/unAssign/:orgId')
  .patch(authMiddleware, requireSuperAdmin, unAssignFromOrganization);

/* Change organization status (Super Admin only) */
router
  .route('/status/:orgId')
  .patch(
    authMiddleware,
    requireSuperAdmin,
    validate(organizationStatusSchema),
    changeStatus,
  );

/* Add user to organization with role (Org access + permission required) */
router
  .route('/addToOrg/:orgId')
  .patch(
    authMiddleware,
    requireOrgAccess,
    requirePermission('manage_org_users'),
    validate(addedToOrg),
    addToOrganization,
  );

/* Fetch all pending organization requests (Super Admin only) */
router
  .route('/pendingOrgRequest')
  .get(authMiddleware, requireSuperAdmin, pendinOrgnizationRequest);

/* Request creation of a new organization */
router.route('/requestOrg').post(requestCreationForOrganizations);

/* Handle organization request approval/rejection (Super Admin only) */
router
  .route('/hanleOrgRequests')
  .post(authMiddleware, requireSuperAdmin, handletOrgRequestDecission);

export default router;
