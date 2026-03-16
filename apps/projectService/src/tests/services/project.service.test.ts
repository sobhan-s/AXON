import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '@dam/utils';

const projectRepoMock = {
  findProjectBySlugs: vi.fn(),
  createProject: vi.fn(),
  getAllProjects: vi.fn(),
  getUserProjects: vi.fn(),
  findProjectById: vi.fn(),
  updateProject: vi.fn(),
  isProjectExist: vi.fn(),
  assignManagerToProject: vi.fn(),
  archiveProject: vi.fn(),
  deleteProject: vi.fn(),
  isTeamMember: vi.fn(),
  addTeamMember: vi.fn(),
  removeTeamMember: vi.fn(),
  getTeamMembers: vi.fn(),
};

const orgRepoMock = {
  findOrgById: vi.fn(),
};

const authRepoMock = {
  findUserById: vi.fn(),
};

const activityMock = {
  logActivity: vi.fn(),
};

vi.mock('../../repository/project.repository.js', () => {
  return {
    ProjectRepository: class {
      findProjectBySlugs = projectRepoMock.findProjectBySlugs;
      createProject = projectRepoMock.createProject;
      getAllProjects = projectRepoMock.getAllProjects;
      getUserProjects = projectRepoMock.getUserProjects;
      findProjectById = projectRepoMock.findProjectById;
      updateProject = projectRepoMock.updateProject;
      isProjectExist = projectRepoMock.isProjectExist;
      assignManagerToProject = projectRepoMock.assignManagerToProject;
      archiveProject = projectRepoMock.archiveProject;
      deleteProject = projectRepoMock.deleteProject;
      isTeamMember = projectRepoMock.isTeamMember;
      addTeamMember = projectRepoMock.addTeamMember;
      removeTeamMember = projectRepoMock.removeTeamMember;
      getTeamMembers = projectRepoMock.getTeamMembers;
    },
  };
});

vi.mock('../../repository/organization.repository.js', () => {
  return {
    OrganizationRepositories: class {
      findOrgById = orgRepoMock.findOrgById;
    },
  };
});

vi.mock('@dam/common', () => {
  return {
    ActivityService: class {
      logActivity = activityMock.logActivity;
    },
    AuthRepository: class {
      findUserById = authRepoMock.findUserById;
    },
  };
});

import { ProjectServices } from '../../services/project.service.js';

describe('ProjectServices', () => {
  let service: ProjectServices;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProjectServices();
  });

  it('should create project successfully', async () => {
    projectRepoMock.findProjectBySlugs.mockResolvedValue(null);

    projectRepoMock.createProject.mockResolvedValue({
      id: 1,
      name: 'test',
      slug: 'test',
      organizationId: 1,
      description: '',
    });

    const result = await service.createProjects(1, 1, '127.0.0.1', 'agent', {
      name: 'test',
      slug: 'test',
    });

    expect(projectRepoMock.createProject).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.createdProject.id).toBe(1);
  });

  it('should throw error if slug already exists', async () => {
    projectRepoMock.findProjectBySlugs.mockResolvedValue({ id: 1 });

    await expect(
      service.createProjects(1, 1, '127.0.0.1', 'agent', {
        name: 'test',
        slug: 'test',
      }),
    ).rejects.toThrow(ApiError);
  });

  it('should fetch all projects', async () => {
    orgRepoMock.findOrgById.mockResolvedValue({ id: 1 });

    projectRepoMock.getAllProjects.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await service.getAllProjects(1);

    expect(result.projects.length).toBe(2);
  });

  it('should throw error if organization not found', async () => {
    orgRepoMock.findOrgById.mockResolvedValue(null);

    await expect(service.getAllProjects(1)).rejects.toThrow(ApiError);
  });

  it('should get project by id', async () => {
    projectRepoMock.findProjectById.mockResolvedValue({
      id: 1,
      name: 'project',
    });

    const result = await service.getProjectById(1);

    expect(result.project.id).toBe(1);
  });

  it('should throw error if project not found', async () => {
    projectRepoMock.findProjectById.mockResolvedValue(null);

    await expect(service.getProjectById(1)).rejects.toThrow(ApiError);
  });

  it('should update project', async () => {
    projectRepoMock.findProjectById.mockResolvedValue({
      id: 1,
      organizationId: 1,
    });

    projectRepoMock.updateProject.mockResolvedValue({
      id: 1,
      name: 'updated',
    });

    const result = await service.updateProject(1, 1, {
      name: 'updated',
    });

    expect(projectRepoMock.updateProject).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.project.name).toBe('updated');
  });

  it('should assign manager to project', async () => {
    orgRepoMock.findOrgById.mockResolvedValue({ id: 1 });

    projectRepoMock.isProjectExist.mockResolvedValue(true);

    authRepoMock.findUserById.mockResolvedValue({ id: 5 });

    projectRepoMock.assignManagerToProject.mockResolvedValue({
      id: 1,
      name: 'test',
      organizationId: 1,
    });

    const result = await service.assignManagerToProject(
      1,
      1,
      5,
      2,
      '127.0.0.1',
      'agent',
    );

    expect(projectRepoMock.assignManagerToProject).toHaveBeenCalled();
    expect(result.id).toBe(1);
  });

  it('should archive project', async () => {
    projectRepoMock.findProjectById.mockResolvedValue({
      id: 1,
      organizationId: 1,
      isArchived: false,
    });

    projectRepoMock.archiveProject.mockResolvedValue({
      id: 1,
      isArchived: true,
    });

    const result = await service.archiveProject(1, 1);

    expect(projectRepoMock.archiveProject).toHaveBeenCalled();
    expect(result.project.isArchived).toBe(true);
  });

  it('should delete project', async () => {
    projectRepoMock.findProjectById.mockResolvedValue({
      id: 1,
      organizationId: 1,
      name: 'test',
    });

    const result = await service.deleteProject(1, 1);

    expect(projectRepoMock.deleteProject).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.message).toBe('Project deleted successfully');
  });

  it('should add team member', async () => {
    projectRepoMock.findProjectById.mockResolvedValue({
      id: 1,
      organizationId: 1,
    });

    authRepoMock.findUserById.mockResolvedValue({
      id: 5,
      organizationId: 1,
    });

    projectRepoMock.isTeamMember.mockResolvedValue(false);

    projectRepoMock.addTeamMember.mockResolvedValue({
      id: 5,
    });

    const result = await service.addTeamMember(1, 2, 5);

    expect(projectRepoMock.addTeamMember).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.member.id).toBe(5);
  });

  it('should remove team member', async () => {
    projectRepoMock.findProjectById.mockResolvedValue({
      id: 1,
      organizationId: 1,
      createdBy: 10,
    });

    projectRepoMock.isTeamMember.mockResolvedValue(true);

    const result = await service.removeTeamMember(1, 2, 5, 1);

    expect(projectRepoMock.removeTeamMember).toHaveBeenCalled();
    expect(activityMock.logActivity).toHaveBeenCalled();
    expect(result.message).toBe('Team member removed successfully');
  });

  it('should fetch team members', async () => {
    projectRepoMock.findProjectById.mockResolvedValue({
      id: 1,
    });

    projectRepoMock.getTeamMembers.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await service.getTeamMembers(1);

    expect(result.members.length).toBe(2);
  });
});
