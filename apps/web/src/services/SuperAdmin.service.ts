import axios from 'axios';
import { SUPER_ADMIN_ORG_ENDPOINTS } from '@/lib/api-endpints';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  storageLimit: string | null;
  storageUsed: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy: number;
  assignedTo: number | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    email: string;
    username: string;
  };
  assignee?: {
    id: number;
    email: string;
    username: string;
  } | null;
  _count?: {
    projects: number;
    users: number;
  };
}

export interface CreateOrgPayload {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateOrgPayload {
  name?: string;
  description?: string;
  storageLimit?: string;
}

const api = axios.create({ withCredentials: true });

export const superAdminOrgService = {
  async getAll(): Promise<Organization[]> {
    const { data } = await api.get(SUPER_ADMIN_ORG_ENDPOINTS.GET_ALL);
    return data?.data?.result ?? data;
  },

  async getById(orgId: number): Promise<Organization> {
    const { data } = await api.get(SUPER_ADMIN_ORG_ENDPOINTS.GET_BY_ID(orgId));
    return data?.data ?? data;
  },

  async create(payload: CreateOrgPayload): Promise<Organization> {
    const { data } = await api.post(SUPER_ADMIN_ORG_ENDPOINTS.CREATE, payload);
    return data?.data ?? data;
  },

  async update(
    orgId: number,
    payload: UpdateOrgPayload,
  ): Promise<Organization> {
    const { data } = await api.put(
      SUPER_ADMIN_ORG_ENDPOINTS.UPDATE(orgId),
      payload,
    );
    return data?.data ?? data;
  },

  async delete(orgId: number): Promise<void> {
    await api.delete(SUPER_ADMIN_ORG_ENDPOINTS.DELETE(orgId));
  },

  async assignAdmin(orgId: number, adminEmail: string): Promise<void> {
    await api.post(SUPER_ADMIN_ORG_ENDPOINTS.ASSIGN(orgId), { adminEmail });
  },

  async unassignAdmin(orgId: number): Promise<void> {
    await api.patch(SUPER_ADMIN_ORG_ENDPOINTS.UNASSIGN(orgId));
  },

  async changeStatus(
    orgId: number,
    status: 'ACTIVE' | 'INACTIVE',
  ): Promise<void> {
    await api.patch(SUPER_ADMIN_ORG_ENDPOINTS.STATUS(orgId), { status });
  },
};
