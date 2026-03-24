import { IRouter, Router } from 'express';
import {
  addUsersToOrganizations,
  changePasswordHandler,
  deleteMe,
  getOrganizationMembers,
  getUserMe,
  removeUsersToOrganizations,
  updateUserMe,
  getParticularUser,
  updateUserDetailInOrg,
} from '../controller/user.controller.js';
import {
  authMiddleware,
  requireOrgAccess,
  requirePermission,
  validate,
} from '@dam/middlewares';
import { addUserToOrg, updateUserAdminLevelSchema } from '@dam/validations';

const router: IRouter = Router();

/* Fetch current authenticated user profile */
router.route('/getme').get(authMiddleware, getUserMe);

/* Update current authenticated user profile */
router.route('/updateme').patch(authMiddleware, updateUserMe);

/* Delete current authenticated user account */
router.route('/deleteme').delete(authMiddleware, deleteMe);

/* Change password for current authenticated user */
router.route('/changePassword').patch(authMiddleware, changePasswordHandler);

// Admin level routes

/* Fetch all users in an organization admin level access */
router
  .route('/getOrgUsers/:orgId')
  .get(
    authMiddleware,
    requireOrgAccess,
    requirePermission('manage_org_users'),
    getOrganizationMembers,
  );

/* Fetch a particular user in an organization */
router
  .route('/puser/:orgId/:userId')
  .get(authMiddleware, requireOrgAccess, getParticularUser);

/* Create a new user in an organization (admin-level) */
router
  .route('/createUser/:orgId')
  .post(
    authMiddleware,
    requireOrgAccess,
    requirePermission('manage_org_users'),
    validate(addUserToOrg),
    addUsersToOrganizations,
  );

/* Remove a user from an organization (admin-level) */
router
  .route('/removeUser/:orgId')
  .delete(
    authMiddleware,
    requireOrgAccess,
    requirePermission('manage_org_users'),
    removeUsersToOrganizations,
  );

/* Update user details within an organization (admin-level) */
router
  .route('/update/:orgId')
  .put(
    authMiddleware,
    requireOrgAccess,
    requirePermission('manage_org_users'),
    validate(updateUserAdminLevelSchema),
    updateUserDetailInOrg,
  );

export default router;
