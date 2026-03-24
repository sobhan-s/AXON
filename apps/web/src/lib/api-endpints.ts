// const ANALYTICS_SERVICE = 'http://localhost:8007';
// const GATEWAY_API = 'http://localhost:8000';

const ANALYTICS_SERVICE = '/api/an/';
const GATEWAY_API = '/api';

// console.log('asdfasdfasdfasdfasdfasdfasdasdfas', GATEWAY_API);

export const AUTH_ENDPOINTS = {
  REGISTER: `${GATEWAY_API}/auth/register`,
  LOGIN: `${GATEWAY_API}/auth/login`,
  LOGOUT: `${GATEWAY_API}/auth/logout`,
  LOGOUT_ALL: `${GATEWAY_API}/auth/logout-all`,
  REFRESH_TOKEN: `${GATEWAY_API}/auth/refresh-token`,
  VERIFY_EMAIL: `${GATEWAY_API}/auth/verify-email`,
  RESEND_VERIFICATION: `${GATEWAY_API}/auth/resend-verification`,
  FORGOT_PASSWORD: `${GATEWAY_API}/auth/forgot-password`,
  RESET_PASSWORD: `${GATEWAY_API}/auth/reset-password`,
} as const;

export const USER_ENDPOINTS = {
  GET_ME: `${GATEWAY_API}/user/getme`,
  UPDATE_ME: `${GATEWAY_API}/user/updateme`,
  DELETE_ME: `${GATEWAY_API}/user/deleteme`,
  CHANGE_PASSWORD: `${GATEWAY_API}/user/changePassword`,
} as const;

export const ADMIN_USER_ENDPOINTS = {
  GET_ORG_USERS: (orgId: number) => `${GATEWAY_API}/user/getOrgUsers/${orgId}`,
  GET_USER: (orgId: number, userId: number) =>
    `${GATEWAY_API}/puser/${orgId}/${userId}`,
  CREATE_USER: (orgId: number) => `${GATEWAY_API}/user/createUser/${orgId}`,
  REMOVE_USER: (orgId: number) => `${GATEWAY_API}/user/removeUser/${orgId}`,
  UPDATE_USER: (orgId: number) => `${GATEWAY_API}/user/update/${orgId}`,
} as const;

export const SUPER_ADMIN_ORG_ENDPOINTS = {
  CREATE: `${GATEWAY_API}/orgs/create`,
  GET_ALL: `${GATEWAY_API}/orgs/allOrg`,
  GET_BY_ID: (orgId: number) => `${GATEWAY_API}/orgs/getOrgById/${orgId}`,
  UPDATE: (orgId: number) => `${GATEWAY_API}/orgs/update/${orgId}`,
  DELETE: (orgId: number) => `${GATEWAY_API}/orgs/deleteOrg/${orgId}`,
  ASSIGN: (orgId: number) => `${GATEWAY_API}/orgs/assign/${orgId}`,
  UNASSIGN: (orgId: number) => `${GATEWAY_API}/orgs/unAssign/${orgId}`,
  STATUS: (orgId: number) => `${GATEWAY_API}/orgs/status/${orgId}`,
  PEINDING_ORGANIZATION_REQUEST: `{PROJECTSERVICE_BASE}/orgs/pendingOrgRequest`,
  REQUEST_ORG: `${GATEWAY_API}/orgs/requestOrg`,
  HANDLE_ORG_REQUESTS: `${GATEWAY_API}/orgs/hanleOrgRequests`,
} as const;

export const PROJECT_ENDPOINTS = {
  // Projects
  GET_ALL: (orgId: number) => `${GATEWAY_API}/project/${orgId}/all`,

  GET_MY_PROJECTS: () => `${GATEWAY_API}/project/my-projects`,

  GET_BY_ID: (orgId: number, projectId: number) =>
    `${GATEWAY_API}/project/getProject/${orgId}/${projectId}`,

  CREATE: (orgId: number) => `${GATEWAY_API}/project/${orgId}/create`,

  UPDATE: (projectId: number) => `${GATEWAY_API}/project/${projectId}`,

  ARCHIVE: (orgId: number, projectId: number) =>
    `${GATEWAY_API}/project/archiveProject/${orgId}/${projectId}`,

  DELETE: (orgId: number, projectId: number) =>
    `${GATEWAY_API}/project/deleteProject/${orgId}/${projectId}`,

  ASSIGN_MANAGER: (orgId: number, projectId: number) =>
    `${GATEWAY_API}/project/assignManager/${orgId}/${projectId}`,

  GET_TEAM: (orgId: number, projectId: number) =>
    `${GATEWAY_API}/project/getTeamMembers/${orgId}/${projectId}`,

  ADD_MEMBER: (orgId: number, projectId: number) =>
    `${GATEWAY_API}/project/addTeamMembers/${orgId}/${projectId}`,

  REMOVE_MEMBER: (orgId: number, projectId: number) =>
    `${GATEWAY_API}/project/removeTeamMember/${orgId}/${projectId}`,
} as const;

export const TASK_ENDPOINTS = {
  // my tasks
  GET_MY_TASKS: (projectId: number) => `${GATEWAY_API}/tasks/my/${projectId}`,

  GET_MY_OVERDUE: (projectId: number) =>
    `${GATEWAY_API}/tasks/my/overdue/${projectId}`,

  // project tasks
  GET_PROJECT_TASKS: (projectId: number) =>
    `${GATEWAY_API}/tasks/getProjectTasks/project/${projectId}`,

  GET_OVERDUE: (projectId: number) =>
    `${GATEWAY_API}/tasks/overdueTasks/project/${projectId}`,

  CREATE_TASK: (projectId: number) =>
    `${GATEWAY_API}/tasks/createTask/project/${projectId}`,

  // single task
  GET_TASK: (projectId: number, taskId: number) =>
    `${GATEWAY_API}/tasks/getTaskById/${projectId}/${taskId}`,

  UPDATE_TASK: (projectId: number, taskId: number) =>
    `${GATEWAY_API}/tasks/updateTask/${projectId}/${taskId}`,

  DELETE_TASK: (taskId: number) => `${GATEWAY_API}/tasks/deleteTask/${taskId}`,

  // status & assign
  CHANGE_STATUS: (projectId: number, taskId: number) =>
    `${GATEWAY_API}/tasks/status/${projectId}/${taskId}`,

  ASSIGN_TASK: (projectId: number, taskId: number) =>
    `${GATEWAY_API}/tasks/assign/${projectId}/${taskId}`,

  // bulk
  BULK_ASSIGN: (projectId: number) =>
    `${GATEWAY_API}/tasks/bulk/assign/${projectId}`,

  BULK_STATUS: `${GATEWAY_API}/tasks/bulk/status`,

  BULK_DELETE: (projectId: number) =>
    `${GATEWAY_API}/tasks/bulk/delete/${projectId}`,

  // approvals
  GET_APPROVALS: (taskId: number) => `${GATEWAY_API}/tasks/${taskId}/approvals`,

  GET_PENDING_APPROVALS: (projectId: number) =>
    `${GATEWAY_API}/tasks/getPendingApprovals/${projectId}`,

  // timelogs
  GET_TIMELOGS: (taskId: number) => `${GATEWAY_API}/tasks/${taskId}/timelogs`,

  DELETE_TIMELOG: (taskId: number, timeLogId: number) =>
    `${GATEWAY_API}/tasks/${taskId}/timelogs/${timeLogId}`,
} as const;

export const COMMENTS_ENDPOINT = {
  ADD_COMMENT: (projectId: number) =>
    `${GATEWAY_API}/comment/${projectId}/create`,
  GET_COMMENT: (projectId: number, taskId: number) =>
    `${GATEWAY_API}/comment/${projectId}/task/${taskId}`,
  UPDATE_COMMENT: (projectId: number, commentId: number) =>
    `${GATEWAY_API}/comment/${projectId}/${commentId}`,
  DELETE_COMMENT: (projectId: number, commentId: number) =>
    `${GATEWAY_API}/comment/${projectId}/${commentId}`,
};

export const ASSET_ENDPOINTS = {
  UPLOAD: `${GATEWAY_API}/assets/upload`,
  GET_BY_TASK: (taskId: number) => `${GATEWAY_API}/assets/task/${taskId}`,
  GET_BY_PROJECT: (projectId: number) =>
    `${GATEWAY_API}/assets/project/${projectId}`,
  GET_BY_ID: (assetId: string) => `${GATEWAY_API}/assets/${assetId}`,
  GET_VERSIONS: (assetId: string) =>
    `${GATEWAY_API}/assets/${assetId}/versions`,
  GET_DOWNLOAD_URL: (assetId: string) =>
    `${GATEWAY_API}/assets/${assetId}/download`,
  GET_VARIANT_DOWNLOAD_URL: (variantId: string) =>
    `${GATEWAY_API}/assetvariants/${variantId}/download`,
  TRACK_VIEW: (assetId: string) => `${GATEWAY_API}/assets/${assetId}/view`,
  FINALIZE: (assetId: string) => `${GATEWAY_API}/assets/${assetId}/finalize`,
  DELETE: (assetId: string) => `${GATEWAY_API}/api/assets/${assetId}`,
  GET_VARIANTS: (assetId: string) =>
    `${GATEWAY_API}/assetvariants/${assetId}/variants`,
  REQUEST_VARIANTS: (assetId: string) =>
    `${GATEWAY_API}/assetvariants/${assetId}/variants`,
} as const;

export const ANALYTICS_ENDPOINT = {
  ORG_ANALYTICS: (orgId: number) =>
    `${ANALYTICS_SERVICE}/analytics/org/overview/${orgId}`,

  PLATFORM_ANALYTICS: `${ANALYTICS_SERVICE}/analytics/platform/overview`,

  PROJECT_ANALYTICS: (projectId: number) =>
    `${ANALYTICS_SERVICE}/analytics/project/${projectId}/overview`,

  REPORT_PLATFORM: `${ANALYTICS_SERVICE}/analytics/report/platform`,

  REPORT_ORG: (orgId: number) =>
    `${ANALYTICS_SERVICE}/analytics/report/org/${orgId}`,

  REPORT_PROJECT: (projectId: number) =>
    `${ANALYTICS_SERVICE}/analytics/report/project/${projectId}`,
};
