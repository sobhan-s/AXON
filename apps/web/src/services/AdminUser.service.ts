import axios from 'axios';
import { ADMIN_USER_ENDPOINTS } from '@/lib/api-endpints';

export interface OrgUser {
  id: number;
  projectId: number | null;
  organizationId: number;
  userId: number;
  addedBy: number;
  roleId: number;
  addedAt: string;
  user: {
    id: number;
    email: string;
    username: string;
    avatarUrl: string | null;
  };
  role: {
    id: number;
    name: string;
    level: number;
    description: string;
  };
  project?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

export interface FlatUser {
  membershipId: number;
  id: number;
  email: string;
  username: string;
  avatarUrl: string | null;
  isActive?: boolean;
  addedAt: string;
  role: {
    id: number;
    name: string;
    level: number;
  };
  project?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  username: string;
  roleId: number;
}

export interface UpdateUserPayload {
  email?: string;
  username?: string;
  isActive?: boolean;
  roleId?: number;
}

const api = axios.create({ withCredentials: true });

export const adminUserService = {
  async getOrgUsers(orgId: number): Promise<OrgUser[]> {
    const { data } = await api.get(ADMIN_USER_ENDPOINTS.GET_ORG_USERS(orgId));
    return data?.data?.OrgUsers ?? [];
  },

  async getUser(orgId: number, userId: number): Promise<OrgUser> {
    const { data } = await api.get(
      ADMIN_USER_ENDPOINTS.GET_USER(orgId, userId),
    );
    return data?.data ?? data;
  },

  async createUser(
    orgId: number,
    payload: CreateUserPayload,
  ): Promise<OrgUser> {
    const { data } = await api.post(
      ADMIN_USER_ENDPOINTS.CREATE_USER(orgId),
      payload,
    );
    return data?.data ?? data;
  },

  async removeUser(orgId: number, userId: number): Promise<void> {
    await api.delete(ADMIN_USER_ENDPOINTS.REMOVE_USER(orgId), {
      data: { targetUserId: userId },
    });
  },

  async updateUser(orgId: number, payload: UpdateUserPayload): Promise<void> {
    await api.put(ADMIN_USER_ENDPOINTS.UPDATE_USER(orgId), payload);
  },
};
