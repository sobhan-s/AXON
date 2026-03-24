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

/* Create a new project under an organization */
router
  .route('/:orgId/create')
  .post(
    authMiddleware,
    requireOrgAccess,
    requirePermission('create_project'),
    validate(createProjectsSchemas),
    createProject,
  );

/* Fetch all projects of an organization */
router.get('/:orgId/all', authMiddleware, requireOrgAccess, getAllProjects);

// user level , all project i am member of
router.get('/my-projects', authMiddleware, getMyProjects);

/* Assign a manager to a project */
router
  .route('/assignManager/:orgId/:projectId')
  .patch(
    authMiddleware,
    requireOrgAccess,
    requirePermission('manage_org_users'),
    addManager,
  );

/* Update project details */
router.put(
  '/:projectId',
  authMiddleware,
  requireProjectAccess,
  requirePermission('update_project'),
  validate(updateProjectSchema),
  updateProject,
);

/* Add team members to a project */
router
  .route('/addTeamMembers/:orgId/:projectId')
  .post(
    authMiddleware,
    requireOrgAccess,
    requirePermission('manage_project_team'),
    addTeamMember,
  );

/* Remove a team member from a project */
router
  .route('/removeTeamMember/:orgId/:projectId')
  .delete(
    authMiddleware,
    requireOrgAccess,
    requireProjectAccess,
    requirePermission('manage_project_team'),
    removeTeamMember,
  );

/* Fetch project details by ID */
router
  .route('/getProject/:orgId/:projectId')
  .get(authMiddleware, requireOrgAccess, requireProjectAccess, getProjectById);

/* Archive a project */
router
  .route('/archiveProject/:orgId/:projectId')
  .patch(
    authMiddleware,
    requireOrgAccess,
    requireProjectAccess,
    requirePermission('archive_project'),
    archiveProject,
  );

/* Delete a project */
router
  .route('/deleteProject/:orgId/:projectId')
  .delete(
    authMiddleware,
    requireOrgAccess,
    requireProjectAccess,
    requirePermission('delete_project'),
    deleteProject,
  );

/* Fetch all team members of a project */
router.route('/getTeamMembers/:orgId/:projectId').get(
  authMiddleware,
  requireOrgAccess,
  requireProjectAccess,
  // requirePermission('manage_project_team'),
  getTeamMembers,
);

export default router;
