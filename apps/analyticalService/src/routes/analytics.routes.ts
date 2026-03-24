import { IRouter, Router } from 'express';
import {
  orgOverview,
  platformOverview,
  projectOverview,
} from '../controller/analytics.controller.js';
import {
  generatePlatformReport,
  generateOrgReport,
  generateProjectReport,
} from '../controller/report.controller.js';
import { authMiddleware } from '@dam/middlewares';

const router: IRouter = Router();
router.use(authMiddleware);

/* Fetch organization overview dashboard data */
router.route('/org/overview/:orgId').get(orgOverview);

/* Fetch platform overview dashboard data */
router.route('/platform/overview').get(platformOverview);

/* Fetch project overview dashboard data */
router.route('/project/:projectId/overview').get(projectOverview);

/* Generate platform report and send via email */
router.post('/report/platform', generatePlatformReport);

/* Generate organization report and send via email */
router.post('/report/org/:orgId', generateOrgReport);

/* Generate project report and send via email */
router.post('/report/project/:projectId', generateProjectReport);

export default router;
