const AUTHSERVICE_BASE = 'http://localhost:8001';
const USERSERVICE_BASE = 'http://localhost:8002';

export const AUTH_ENDPOINTS = {
  REGISTER: `${AUTHSERVICE_BASE}/auth/register`,
  LOGIN: `${AUTHSERVICE_BASE}/auth/login`,
  LOGOUT: `${AUTHSERVICE_BASE}/auth/logout`,
  LOGOUT_ALL: `${AUTHSERVICE_BASE}/auth/logout-all`,
  REFRESH_TOKEN: `${AUTHSERVICE_BASE}/auth/refresh-token`,
  VERIFY_EMAIL: `${AUTHSERVICE_BASE}/auth/verify-email`,
  RESEND_VERIFICATION: `${AUTHSERVICE_BASE}/auth/resend-verification`,
  FORGOT_PASSWORD: `${AUTHSERVICE_BASE}/auth/forgot-password`,
  RESET_PASSWORD: `${AUTHSERVICE_BASE}/auth/reset-password`,
} as const;

export const USER_ENDPOINTS = {
  GET_ME: `${AUTHSERVICE_BASE}/user/getme`,
  UPDATE_ME: `${AUTHSERVICE_BASE}/user/updateme`,
  DELETE_ME: `${AUTHSERVICE_BASE}/user/deleteme`,
  CHANGE_PASSWORD: `${AUTHSERVICE_BASE}/user/changePassword`,
} as const;

export const ADMIN_USER_ENDPOINTS = {
  GET_ORG_USERS: (orgId: number) =>
    `${AUTHSERVICE_BASE}/user/getOrgUsers/${orgId}`,
  GET_USER: (orgId: number, userId: number) =>
    `${AUTHSERVICE_BASE}/puser/${orgId}/${userId}`,
  CREATE_USER: (orgId: number) =>
    `${AUTHSERVICE_BASE}/user/createUser/${orgId}`,
  REMOVE_USER: (orgId: number) =>
    `${AUTHSERVICE_BASE}/user/removeUser/${orgId}`,
  UPDATE_USER: (orgId: number) => `${AUTHSERVICE_BASE}/user/update/${orgId}`,
} as const;

export const SUPER_ADMIN_ORG_ENDPOINTS = {
  CREATE: `${USERSERVICE_BASE}/orgs/create`,
  GET_ALL: `${USERSERVICE_BASE}/orgs/allOrg`,
  GET_BY_ID: (orgId: number) => `${USERSERVICE_BASE}/orgs/getOrgById/${orgId}`,
  UPDATE: (orgId: number) => `${USERSERVICE_BASE}/orgs/update/${orgId}`,
  DELETE: (orgId: number) => `${USERSERVICE_BASE}/orgs/deleteOrg/${orgId}`,
  ASSIGN: (orgId: number) => `${USERSERVICE_BASE}/orgs/assign/${orgId}`,
  UNASSIGN: (orgId: number) => `${USERSERVICE_BASE}/orgs/unAssign/${orgId}`,
  STATUS: (orgId: number) => `${USERSERVICE_BASE}/orgs/status/${orgId}`,
} as const;

export const PROJECT_ENDPOINTS = {
  GET_ALL: (orgId: number) => `${USERSERVICE_BASE}/projects/org/${orgId}`,
  GET_BY_ID: (projectId: number) => `${USERSERVICE_BASE}/projects/${projectId}`,
  CREATE: (orgId: number) => `${USERSERVICE_BASE}/projects/org/${orgId}`,
  UPDATE: (projectId: number) => `${USERSERVICE_BASE}/projects/${projectId}`,
  DELETE: (projectId: number) => `${USERSERVICE_BASE}/projects/${projectId}`,
  ASSIGN_MANAGER: (projectId: number) =>
    `${USERSERVICE_BASE}/projects/${projectId}/assign-manager`,
  GET_TEAM: (projectId: number) =>
    `${USERSERVICE_BASE}/projects/${projectId}/team`,
  ADD_MEMBER: (projectId: number) =>
    `${USERSERVICE_BASE}/projects/${projectId}/team`,
  REMOVE_MEMBER: (projectId: number, userId: number) =>
    `${USERSERVICE_BASE}/projects/${projectId}/team/${userId}`,
} as const;
