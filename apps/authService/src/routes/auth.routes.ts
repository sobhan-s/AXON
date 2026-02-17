import { IRouter, Router } from 'express';
import {
  register,
  login,
  verifyEmail,
  refreshToken,
  logout,
  logoutAllDevices,
  forgotPassword,
  resetPassword,
  resendVerificationEmail,
} from '../controller/auth.controller.js';
import { authMiddleware, rateLimiter } from '@dam/middlewares';

const router: IRouter = Router();

router.post('/register', rateLimiter(5, 15), register);
router.post('/login', rateLimiter(5, 15), login);
router.get('/verify-email', verifyEmail);
router.post(
  '/resend-verification',
  rateLimiter(3, 15),
  resendVerificationEmail,
);
router.post('/forgot-password', rateLimiter(3, 15), forgotPassword);
router.post('/reset-password', rateLimiter(5, 15), resetPassword);
router.post('/refresh-token', refreshToken);

router.post('/logout', authMiddleware, logout);
router.post('/logout-all', authMiddleware, logoutAllDevices);

export default router;
