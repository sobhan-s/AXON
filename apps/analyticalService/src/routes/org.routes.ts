import { IRouter, Router } from 'express';
import {
    orgActivity,
  orgOverview,
  orgStorage,
  orgUsers,
} from '../controller/org.analytics.controller.js';

const router: IRouter = Router();

router.route('/org/overview/:orgId').get(orgOverview);
router.route('/org/storage/:orgId').get(orgStorage);
router.route('/org/users/:orgId').get(orgUsers);
router.route('/org/activity/:orgId').get(orgActivity);

export default router;
