import axios from 'axios';
import { PROJECT_ENDPOINTS } from '@/lib/api-endpints';

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string | null;

  organizationId: number;

  createdBy: number;
  assignedTo: number | null;

  status: 'ACTIVE' | 'INACTIVE';
  isArchived: boolean;

  startDate: string | null;
  endDate: string | null;

  createdAt: string;
  updatedAt: string;

  creator: {
    id: number;
    email: string;
    username: string;
  };

  assignee: {
    id: number;
    email: string;
    username: string;
  } | null;

  _count?: {
    tasks: number;
    teamMembers: number;
  };

  myRole?: {
    id: number;
    name: string;
    level: number;
  };
}

export interface ProjectMember {
  id: number;
  projectId: number;
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
}

export interface CreateProjectPayload {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

const api = axios.create({
  withCredentials: true,
});

export const projectService = {
  /** ---------------- Projects ---------------- */

  async getAll(orgId: number): Promise<Project[]> {
    const { data } = await api.get(PROJECT_ENDPOINTS.GET_ALL(orgId));
    // console.log('adsfasdfasd', data?.data?.projects);

    return data?.data?.projects ?? [];
  },

  async getMyProjects(): Promise<Project[]> {
    const { data } = await api.get(PROJECT_ENDPOINTS.GET_MY_PROJECTS());
    return data?.data?.projects ?? data;
  },

  async getById(orgId: number, projectId: number): Promise<Project> {
    console.log('=----', orgId, projectId);

    const { data } = await api.get(
      PROJECT_ENDPOINTS.GET_BY_ID(orgId, projectId),
    );
    return data?.data?.project ?? [];
  },

  async create(orgId: number, payload: CreateProjectPayload): Promise<Project> {
    const { data } = await api.post(PROJECT_ENDPOINTS.CREATE(orgId), payload);
    return data?.data ?? data;
  },

  async update(
    projectId: number,
    payload: UpdateProjectPayload,
  ): Promise<Project> {
    const { data } = await api.put(
      PROJECT_ENDPOINTS.UPDATE(projectId),
      payload,
    );
    return data?.data ?? data;
  },

  async archive(orgId: number, projectId: number): Promise<void> {
    await api.patch(PROJECT_ENDPOINTS.ARCHIVE(orgId, projectId));
  },

  async delete(orgId: number, projectId: number): Promise<void> {
    await api.delete(PROJECT_ENDPOINTS.DELETE(orgId, projectId));
  },

  /** ---------------- Team ---------------- */

  async getTeam(orgId: number, projectId: number): Promise<ProjectMember[]> {
    const { data } = await api.get(
      PROJECT_ENDPOINTS.GET_TEAM(orgId, projectId),
    );
    return data?.data?.members ?? data;
  },

  async addMember(
    orgId: number,
    projectId: number,
    payload: { userId: number; roleId: number },
  ): Promise<void> {
    await api.post(PROJECT_ENDPOINTS.ADD_MEMBER(orgId, projectId), payload);
  },

  async removeMember(orgId: number, projectId: number): Promise<void> {
    await api.delete(PROJECT_ENDPOINTS.REMOVE_MEMBER(orgId, projectId));
  },

  /** ---------------- Manager ---------------- */

  async assignManager(
    orgId: number,
    projectId: number,
    userId: number,
  ): Promise<void> {
    await api.patch(PROJECT_ENDPOINTS.ASSIGN_MANAGER(orgId, projectId), {
      userId,
    });
  },
};
