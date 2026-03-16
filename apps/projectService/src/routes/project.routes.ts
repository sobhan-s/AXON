import {
  addManager,
  addTeamMember,
  archiveProject,
  createProject,
  deleteProject,
  getAllProjects,
  getMyProjects,
  getProjectById,
  getTeamMembers,
  removeTeamMember,
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

router
  .route('/assignManager/:orgId/:projectId')
  .patch(
    authMiddleware,
    requireOrgAccess,
    requirePermission('manage_org_users'),
    addManager,
  );

router.put(
  '/:projectId',
  authMiddleware,
  requireProjectAccess,
  requirePermission('update_project'),
  validate(updateProjectSchema),
  updateProject,
);

router
  .route('/addTeamMembers/:orgId/:projectId')
  .post(
    authMiddleware,
    requireOrgAccess,
    requirePermission('manage_project_team'),
    addTeamMember,
  );

router
  .route('/removeTeamMember/:orgId/:projectId')
  .delete(
    authMiddleware,
    requireOrgAccess,
    requireProjectAccess,
    requirePermission('manage_project_team'),
    removeTeamMember,
  );

router
  .route('/getProject/:orgId/:projectId')
  .get(authMiddleware, requireOrgAccess, requireProjectAccess, getProjectById);

router
  .route('/archiveProject/:orgId/:projectId')
  .patch(
    authMiddleware,
    requireOrgAccess,
    requireProjectAccess,
    requirePermission('archive_project'),
    archiveProject,
  );

router
  .route('/deleteProject/:orgId/:projectId')
  .delete(
    authMiddleware,
    requireOrgAccess,
    requireProjectAccess,
    requirePermission('delete_project'),
    deleteProject,
  );

router
  .route('/getTeamMembers/:orgId/:projectId')
  .get(
    authMiddleware,
    requireOrgAccess,
    requireProjectAccess,
    // requirePermission('manage_project_team'),
    getTeamMembers,
  );

export default router;
