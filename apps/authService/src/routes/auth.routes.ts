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

/* Register a new user with rate limiting */
router.post('/register', rateLimiter(5, 15), register);

/* Authenticate user and generate tokens */
router.post('/login', login);

/* Verify user email */
router.post('/verify-email', verifyEmail);

/* Resend email verification link with rate limiting */
router.post(
  '/resend-verification',
  rateLimiter(3, 15),
  resendVerificationEmail,
);

/* Send forgot password email with rate limiting */
router.post('/forgot-password', rateLimiter(3, 15), forgotPassword);

/* Reset user password with rate limiting */
router.post('/reset-password', rateLimiter(5, 15), resetPassword);

/* Refresh access and refresh tokens */
router.post('/refresh-token', refreshToken);

/* Logout current user */
router.post('/logout', authMiddleware, logout);

/* Logout user from all devices */
router.post('/logout-all', authMiddleware, logoutAllDevices);

export default router;
