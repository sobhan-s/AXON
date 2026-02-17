import { register, login, verifyEmail } from '../controller/auth.controller.js';
import { IRouter, Router } from 'express';

const router: IRouter = Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/verify-email').get(verifyEmail);

export default router;
