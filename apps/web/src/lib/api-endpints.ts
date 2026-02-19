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

export const USER_ENDPOINTS = {
  GET_ME: `${BASE}/user/getme`,
  UPDATE_ME: `${BASE}/user/updateme`,
  DELETE_ME: `${BASE}/user/deleteme`,
  CHANGE_PASSWORD: `${BASE}/user/changePassword`,
} as const;
