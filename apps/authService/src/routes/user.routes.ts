import { IRouter, Router } from 'express';
import {
  changePasswordHandler,
  deleteMe,
  getUserMe,
  updateUserMe,
} from '../controller/user.controller.js';
import { authMiddleware } from '@dam/middlewares';

const router: IRouter = Router();

router.route('/getme').get(authMiddleware, getUserMe);
router.route('/updateme').patch(authMiddleware, updateUserMe);
router.route('/deleteme').delete(authMiddleware, deleteMe);
router.route('/changePassword').patch(authMiddleware, changePasswordHandler);

export default router;
