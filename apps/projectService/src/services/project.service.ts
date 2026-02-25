import { logger } from '@dam/config';
import { ProjectRepository } from '../repository/project.repository.js';
import { ApiError } from '@dam/utils';
import { ActivityService } from '@dam/common';
import { ProjectStatus } from '@dam/postgresql_db';
import { AuthRepository } from '@dam/common';
import { OrganizationRepositories } from '../repository/organization.repository.js';

export class ProjectServices {
  private projectRepo: ProjectRepository;
  private activityService: ActivityService;
  private authRepo: AuthRepository;
  private orgRepo: OrganizationRepositories;

  constructor() {
    this.projectRepo = new ProjectRepository();
    this.activityService = new ActivityService();
    this.authRepo = new AuthRepository();
    this.orgRepo = new OrganizationRepositories();
  }

  async createProjects(
    adminId: number,
    organizationId: number,
    ip: string,
    userAgent: string,
    data: {
      name: string;
      slug: string;
      description?: string;
    },
  ) {
    logger.info('Project creation service started', {
      adminId,
      data,
    });

    const existingProject = await this.projectRepo.findProjectBySlugs(
      organizationId,
      data.slug,
    );
    if (existingProject) {
      throw new ApiError(
        409,
        'project with this slug already exists. Please choose a different slug.',
      );
    }

    const createdProject = await this.projectRepo.createProject(
      adminId,
      organizationId,
      {
        name: data.name,
        slug: data.slug,
        description: data.description || '',
      },
    );

    logger.info('project created', { organizationId: createdProject.id });

    await this.activityService.logActivity({
      userId: adminId,
      organizationId: createdProject.organizationId,
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: createdProject.id.toString(),
      details: {
        orgName: createdProject.name,
        description: createdProject.description,
        status: 'No manager assigned yet',
      },
      ipAddress: ip,
      userAgent: userAgent,
    });

    logger.info('Organization creation complete');

    return {
      createdProject,
    };
  }

  async getAllProjects(organizationId: number) {
    logger.info('Fetching all projects in service layer', { organizationId });

    const isOrganizationExist = await this.orgRepo.findOrgById(organizationId);

    if (!isOrganizationExist) {
      throw new ApiError(404, 'Organization is not found');
    }

    const projects = await this.projectRepo.getAllProjects(organizationId);

    logger.info('All project fetched successfully in service layer');

    return { projects };
  }

  async getUserProjects(userId: number) {
    logger.info('Fetching user projects', { userId });

    const projects = await this.projectRepo.getUserProjects(userId);

    return { projects };
  }

  async getProjectById(projectId: number) {
    logger.info('Fetching project', { projectId });

    const project = await this.projectRepo.findProjectById(projectId);

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    return { project };
  }

  async updateProject(
    projectId: number,
    userId: number,
    data: {
      name?: string;
      description?: string;
      status?: ProjectStatus;
      startDate?: string;
      endDate?: string;
      assignedTo?: number;
    },
  ) {
    logger.info('Updating project', { projectId, data });

    const project = await this.projectRepo.findProjectById(projectId);

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    console.log('==========', data.status);
    console.log('==========', typeof data.status);

    const updatedProject = await this.projectRepo.updateProject(projectId, {
      name: data.name,
      description: data.description,
      status: data.status as any,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      assignedTo: data.assignedTo,
    });

    await this.activityService.logActivity({
      userId,
      organizationId: project.organizationId,
      action: 'PROJECT_UPDATED',
      entityType: 'project',
      entityId: projectId.toString(),
      details: { updates: data },
    });

    return { project: updatedProject };
  }

  async archiveProject(projectId: number, userId: number) {
    logger.info('Archiving project', { projectId });

    const project = await this.projectRepo.findProjectById(projectId);

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    if (project.isArchived) {
      throw new ApiError(400, 'Project is already archived');
    }

    const archivedProject = await this.projectRepo.archiveProject(projectId);

    await this.activityService.logActivity({
      userId,
      organizationId: project.organizationId,
      action: 'PROJECT_UPDATED',
      entityType: 'project',
      entityId: projectId.toString(),
      details: { action: 'archived' },
    });

    return { project: archivedProject };
  }

  async deleteProject(projectId: number, userId: number) {
    logger.info('Deleting project', { projectId });

    const project = await this.projectRepo.findProjectById(projectId);

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    await this.projectRepo.deleteProject(projectId);

    await this.activityService.logActivity({
      userId,
      organizationId: project.organizationId,
      action: 'ORG_DELETED',
      entityType: 'project',
      entityId: projectId.toString(),
      details: {
        projectName: project.name,
        deletedBy: userId,
      },
    });

    return { message: 'Project deleted successfully' };
  }

  async addTeamMember(
    projectId: number,
    userId: number,
    targetUserId: number,
    roleId: number,
  ) {
    logger.info('Adding team member', { projectId, targetUserId, roleId });

    const project = await this.projectRepo.findProjectById(projectId);

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const targetUser = await this.authRepo.findUserById(targetUserId);

    if (!targetUser) {
      throw new ApiError(404, 'User not found');
    }

    if (targetUser.organizationId !== project.organizationId) {
      throw new ApiError(400, 'User must be in the same organization');
    }

    const isAlreadyMember = await this.projectRepo.isTeamMember(
      projectId,
      targetUserId,
    );

    if (isAlreadyMember) {
      throw new ApiError(400, 'User is already a team member');
    }

    const member = await this.projectRepo.addTeamMember(
      projectId,
      targetUserId,
      roleId,
      userId,
      project.organizationId,
    );

    await this.activityService.logActivity({
      userId,
      organizationId: project.organizationId,
      action: 'PROJECT_UPDATED',
      entityType: 'project',
      entityId: projectId.toString(),
      details: {
        action: 'team_member_added',
        targetUserId,
        roleId,
      },
    });

    return { member };
  }

  async removeTeamMember(
    projectId: number,
    userId: number,
    targetUserId: number,
  ) {
    logger.info('Removing team member', { projectId, targetUserId });

    const project = await this.projectRepo.findProjectById(projectId);

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    if (targetUserId === project.createdBy) {
      throw new ApiError(400, 'Cannot remove project creator');
    }

    const isMember = await this.projectRepo.isTeamMember(
      projectId,
      targetUserId,
    );

    if (!isMember) {
      throw new ApiError(404, 'User is not a team member');
    }

    await this.projectRepo.removeTeamMember(projectId, targetUserId);

    await this.activityService.logActivity({
      userId,
      organizationId: project.organizationId,
      action: 'PROJECT_UPDATED',
      entityType: 'project',
      entityId: projectId.toString(),
      details: {
        action: 'team_member_removed',
        targetUserId,
      },
    });

    return { message: 'Team member removed successfully' };
  }

  async getTeamMembers(projectId: number) {
    logger.info('Fetching team members', { projectId });

    const project = await this.projectRepo.findProjectById(projectId);

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const members = await this.projectRepo.getTeamMembers(projectId);

    return { members };
  }
}
