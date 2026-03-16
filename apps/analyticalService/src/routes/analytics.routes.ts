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

router.route('/org/overview/:orgId').get(orgOverview);
router.route('/platform/overview').get(platformOverview);
router.route('/project/:projectId/overview').get(projectOverview);
router.post('/report/platform', generatePlatformReport);
router.post('/report/org/:orgId', generateOrgReport);
router.post('/report/project/:projectId', generateProjectReport);

export default router;
