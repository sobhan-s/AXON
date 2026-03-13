import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockResponse } from '../helper/mockResponse.js';

let controller: any;

const mocks = {
  createProjects: vi.fn(),
  getAllProjects: vi.fn(),
  getUserProjects: vi.fn(),
  getProjectById: vi.fn(),
  updateProject: vi.fn(),
  assignManagerToProject: vi.fn(),
  archiveProject: vi.fn(),
  deleteProject: vi.fn(),
  addTeamMember: vi.fn(),
  removeTeamMember: vi.fn(),
  getTeamMembers: vi.fn(),
};

vi.mock('../../services/project.service.js', () => {
  return {
    ProjectServices: class {
      createProjects = mocks.createProjects;
      getAllProjects = mocks.getAllProjects;
      getUserProjects = mocks.getUserProjects;
      getProjectById = mocks.getProjectById;
      updateProject = mocks.updateProject;
      assignManagerToProject = mocks.assignManagerToProject;
      archiveProject = mocks.archiveProject;
      deleteProject = mocks.deleteProject;
      addTeamMember = mocks.addTeamMember;
      removeTeamMember = mocks.removeTeamMember;
      getTeamMembers = mocks.getTeamMembers;
    },
  };
});

describe('Project Controller', () => {
  let req: any;
  let res: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    controller = await import('../../controller/project.controller.js');

    req = {
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('test-agent'),
      user: { id: 1 },
    };

    res = mockResponse();
  });

  it('should create project', async () => {
    req.params = { orgId: '1' };
    req.body = { name: 'Test Project' };

    mocks.createProjects.mockResolvedValue({ id: 1 });

    await controller.createProject(req, res, vi.fn());

    expect(mocks.createProjects).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should get all projects', async () => {
    req.params = { orgId: '1' };

    mocks.getAllProjects.mockResolvedValue([{ id: 1 }]);

    await controller.getAllProjects(req, res, vi.fn());

    expect(mocks.getAllProjects).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should get my projects', async () => {
    mocks.getUserProjects.mockResolvedValue([{ id: 1 }]);

    await controller.getMyProjects(req, res, vi.fn());

    expect(mocks.getUserProjects).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should get project by id', async () => {
    req.params = { projectId: '5' };

    mocks.getProjectById.mockResolvedValue({ id: 5 });

    await controller.getProjectById(req, res, vi.fn());

    expect(mocks.getProjectById).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should update project', async () => {
    req.params = { projectId: '5' };
    req.body = { name: 'Updated Project' };

    mocks.updateProject.mockResolvedValue({ id: 5 });

    await controller.updateProject(req, res, vi.fn());

    expect(mocks.updateProject).toHaveBeenCalledWith(5, 1, req.body);
  });

  it('should assign manager', async () => {
    req.params = { projectId: '5', orgId: '1' };
    req.body = { targetUserId: 2 };

    mocks.assignManagerToProject.mockResolvedValue({});

    await controller.addManager(req, res, vi.fn());

    expect(mocks.assignManagerToProject).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should archive project', async () => {
    req.params = { projectId: '5' };

    mocks.archiveProject.mockResolvedValue({});

    await controller.archiveProject(req, res, vi.fn());

    expect(mocks.archiveProject).toHaveBeenCalledWith(5, 1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should delete project', async () => {
    req.params = { projectId: '5' };

    mocks.deleteProject.mockResolvedValue({});

    await controller.deleteProject(req, res, vi.fn());

    expect(mocks.deleteProject).toHaveBeenCalledWith(5, 1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should add team member', async () => {
    req.params = { projectId: '5' };
    req.body = { targetUserId: 2 };

    mocks.addTeamMember.mockResolvedValue({});

    await controller.addTeamMember(req, res, vi.fn());

    expect(mocks.addTeamMember).toHaveBeenCalledWith(5, 1, 2);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should remove team member', async () => {
    req.params = { projectId: '5', orgId: '1' };
    req.body = { targetUserId: 2 };

    mocks.removeTeamMember.mockResolvedValue({});

    await controller.removeTeamMember(req, res, vi.fn());

    expect(mocks.removeTeamMember).toHaveBeenCalledWith(5, 1, 2, 1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should get team members', async () => {
    req.params = { projectId: '5' };

    mocks.getTeamMembers.mockResolvedValue([{ id: 2 }]);

    await controller.getTeamMembers(req, res, vi.fn());

    expect(mocks.getTeamMembers).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
