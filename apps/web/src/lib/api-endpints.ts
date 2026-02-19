const BASE = 'http://localhost:8001';

export const AUTH_ENDPOINTS = {
  REGISTER: `${BASE}/auth/register`,
  LOGIN: `${BASE}/auth/login`,
  LOGOUT: `${BASE}/auth/logout`,
  LOGOUT_ALL: `${BASE}/auth/logout-all`,
  REFRESH_TOKEN: `${BASE}/auth/refresh-token`,
  VERIFY_EMAIL: `${BASE}/auth/verify-email`,
  RESEND_VERIFICATION: `${BASE}/auth/resend-verification`,
  FORGOT_PASSWORD: `${BASE}/auth/forgot-password`,
  RESET_PASSWORD: `${BASE}/auth/reset-password`,
} as const;
