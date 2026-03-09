const AUTHSERVICE_BASE = 'http://localhost:8001';
const PROJECTSERVICE_BASE = 'http://localhost:8002';
const TASKSERVICE_BASE = 'http://localhost:8003';
const ASSET_SERVICE = 'http://localhost:8005';

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
  CREATE: `${PROJECTSERVICE_BASE}/orgs/create`,
  GET_ALL: `${PROJECTSERVICE_BASE}/orgs/allOrg`,
  GET_BY_ID: (orgId: number) =>
    `${PROJECTSERVICE_BASE}/orgs/getOrgById/${orgId}`,
  UPDATE: (orgId: number) => `${PROJECTSERVICE_BASE}/orgs/update/${orgId}`,
  DELETE: (orgId: number) => `${PROJECTSERVICE_BASE}/orgs/deleteOrg/${orgId}`,
  ASSIGN: (orgId: number) => `${PROJECTSERVICE_BASE}/orgs/assign/${orgId}`,
  UNASSIGN: (orgId: number) => `${PROJECTSERVICE_BASE}/orgs/unAssign/${orgId}`,
  STATUS: (orgId: number) => `${PROJECTSERVICE_BASE}/orgs/status/${orgId}`,
  PEINDING_ORGANIZATION_REQUEST: `{PROJECTSERVICE_BASE}/orgs/pendingOrgRequest`,
  REQUEST_ORG: `${PROJECTSERVICE_BASE}/orgs/requestOrg`,
  HANDLE_ORG_REQUESTS: `${PROJECTSERVICE_BASE}/orgs/hanleOrgRequests`,
} as const;

export const PROJECT_ENDPOINTS = {
  // Projects
  GET_ALL: (orgId: number) => `${PROJECTSERVICE_BASE}/project/${orgId}/all`,

  GET_MY_PROJECTS: () => `${PROJECTSERVICE_BASE}/project/my-projects`,

  GET_BY_ID: (orgId: number, projectId: number) =>
    `${PROJECTSERVICE_BASE}/project/getProject/${orgId}/${projectId}`,

  CREATE: (orgId: number) => `${PROJECTSERVICE_BASE}/project/${orgId}/create`,

  UPDATE: (projectId: number) => `${PROJECTSERVICE_BASE}/project/${projectId}`,

  ARCHIVE: (orgId: number, projectId: number) =>
    `${PROJECTSERVICE_BASE}/project/archiveProject/${orgId}/${projectId}`,

  DELETE: (orgId: number, projectId: number) =>
    `${PROJECTSERVICE_BASE}/project/deleteProject/${orgId}/${projectId}`,

  ASSIGN_MANAGER: (orgId: number, projectId: number) =>
    `${PROJECTSERVICE_BASE}/project/assignManager/${orgId}/${projectId}`,

  GET_TEAM: (orgId: number, projectId: number) =>
    `${PROJECTSERVICE_BASE}/project/getTeamMembers/${orgId}/${projectId}`,

  ADD_MEMBER: (orgId: number, projectId: number) =>
    `${PROJECTSERVICE_BASE}/project/addTeamMembers/${orgId}/${projectId}`,

  REMOVE_MEMBER: (orgId: number, projectId: number) =>
    `${PROJECTSERVICE_BASE}/project/removeTeamMember/${orgId}/${projectId}`,
} as const;

export const TASK_ENDPOINTS = {
  // my tasks
  GET_MY_TASKS: (projectId: number) =>
    `${TASKSERVICE_BASE}/tasks/my/${projectId}`,

  GET_MY_OVERDUE: (projectId: number) =>
    `${TASKSERVICE_BASE}/tasks/my/overdue/${projectId}`,

  // project tasks
  GET_PROJECT_TASKS: (projectId: number) =>
    `${TASKSERVICE_BASE}/tasks/getProjectTasks/project/${projectId}`,

  GET_OVERDUE: (projectId: number) =>
    `${TASKSERVICE_BASE}/tasks/overdueTasks/project/${projectId}`,

  CREATE_TASK: (projectId: number) =>
    `${TASKSERVICE_BASE}/tasks/createTask/project/${projectId}`,

  // single task
  GET_TASK: (projectId: number, taskId: number) =>
    `${TASKSERVICE_BASE}/tasks/getTaskById/${projectId}/${taskId}`,

  UPDATE_TASK: (projectId: number, taskId: number) =>
    `${TASKSERVICE_BASE}/tasks/updateTask/${projectId}/${taskId}`,

  DELETE_TASK: (taskId: number) =>
    `${TASKSERVICE_BASE}/tasks/deleteTask/${taskId}`,

  // status & assign
  CHANGE_STATUS: (projectId: number, taskId: number) =>
    `${TASKSERVICE_BASE}/tasks/status/${projectId}/${taskId}`,

  ASSIGN_TASK: (projectId: number, taskId: number) =>
    `${TASKSERVICE_BASE}/tasks/assign/${projectId}/${taskId}`,

  // bulk
  BULK_ASSIGN: (projectId: number) =>
    `${TASKSERVICE_BASE}/tasks/bulk/assign/${projectId}`,

  BULK_STATUS: `${TASKSERVICE_BASE}/tasks/bulk/status`,

  BULK_DELETE: (projectId: number) =>
    `${TASKSERVICE_BASE}/tasks/bulk/delete/${projectId}`,

  // approvals
  GET_APPROVALS: (taskId: number) =>
    `${TASKSERVICE_BASE}/tasks/${taskId}/approvals`,

  GET_PENDING_APPROVALS: (projectId: number) =>
    `${TASKSERVICE_BASE}/tasks/getPendingApprovals/${projectId}`,

  // timelogs
  GET_TIMELOGS: (taskId: number) =>
    `${TASKSERVICE_BASE}/tasks/${taskId}/timelogs`,

  DELETE_TIMELOG: (taskId: number, timeLogId: number) =>
    `${TASKSERVICE_BASE}/tasks/${taskId}/timelogs/${timeLogId}`,
} as const;

export const ASSET_ENDPOINTS = {
  UPLOAD: `${ASSET_SERVICE}/api/assets/upload`,
  GET_BY_TASK: (taskId: number) => `${ASSET_SERVICE}/api/assets/task/${taskId}`,
  GET_BY_PROJECT: (projectId: number) =>
    `${ASSET_SERVICE}/api/assets/project/${projectId}`,
  GET_BY_ID: (assetId: string) => `${ASSET_SERVICE}/api/assets/${assetId}`,
  GET_VERSIONS: (assetId: string) =>
    `${ASSET_SERVICE}/api/assets/${assetId}/versions`,
  GET_DOWNLOAD_URL: (assetId: string) =>
    `${ASSET_SERVICE}/api/assets/${assetId}/download`,
  GET_VARIANT_DOWNLOAD_URL: (variantId: string) =>
    `${ASSET_SERVICE}/assetvariants/${variantId}/download`,
  TRACK_VIEW: (assetId: string) =>
    `${ASSET_SERVICE}/api/assets/${assetId}/view`,
  FINALIZE: (assetId: string) =>
    `${ASSET_SERVICE}/api/assets/${assetId}/finalize`,
  DELETE: (assetId: string) => `${ASSET_SERVICE}/api/assets/${assetId}`,
  GET_VARIANTS: (assetId: string) =>
    `${ASSET_SERVICE}/assetvariants/${assetId}/variants`,
  REQUEST_VARIANTS: (assetId: string) =>
    `${ASSET_SERVICE}/assetvariants/${assetId}/variants`,
} as const;
