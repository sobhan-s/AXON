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

router.route('/getme').get(authMiddleware, getUserMe);
router.route('/updateme').patch(authMiddleware, updateUserMe);
router.route('/deleteme').delete(authMiddleware, deleteMe);
router.route('/changePassword').patch(authMiddleware, changePasswordHandler);
router
  .route('/:orgId/:userId')
  .get(authMiddleware, requireOrgAccess, getParticularUser);

// Admin level routes
router
  .route('/getOrgUsers/:orgId')
  .get(
    authMiddleware,
    requireOrgAccess,
    requirePermission('manage_org_users'),
    getOrganizationMembers,
  );

router
  .route('/createUser/:orgId')
  .post(
    authMiddleware,
    requireOrgAccess,
    requirePermission('manage_org_users'),
    validate(addUserToOrg),
    addUsersToOrganizations,
  );

router
  .route('/removeUser/:orgId')
  .delete(
    authMiddleware,
    requireOrgAccess,
    requirePermission('manage_org_users'),
    removeUsersToOrganizations,
  );

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
