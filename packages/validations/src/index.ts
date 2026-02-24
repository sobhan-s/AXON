import {
  verifyEmailSchema,
  registerSchema,
  resetPasswordSchema,
  loginSchema,
  forgotPasswordSchema,
  resendVerificationSchema,
} from './auth/auth.validations.js';

import { passwordVerifySchema } from './user/user.validations.js';
import {
  createOrgsSchemas,
  assignAdminSchema,
  updateOrgsSchema,
  organizationStatusSchema,
} from './orgs/orgs.validations.js';

export {
  verifyEmailSchema,
  registerSchema,
  resetPasswordSchema,
  loginSchema,
  forgotPasswordSchema,
  resendVerificationSchema,
  passwordVerifySchema,
  createOrgsSchemas,
  assignAdminSchema,
  updateOrgsSchema,
  organizationStatusSchema,
};
