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
    logger.info('Fetching project from service', { projectId });

    const project = await this.projectRepo.findProjectById(projectId);

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    logger.info('Fetching project from service completed', { project });

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
    },
  ) {
    logger.info('Updating project', { projectId, data });

    const project = await this.projectRepo.findProjectById(projectId);

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // console.log('==========', data.status);
    // console.log('==========', typeof data.status);

    const updatedProject = await this.projectRepo.updateProject(projectId, {
      name: data.name,
      description: data.description,
      status: data.status as any,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
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

  async assignManagerToProject(
    projectId: number,
    organizationId: number,
    targetUserId: number,
    adminUserId: number,
    ip: string,
    userAgent: string,
  ) {
    logger.info('assign a manager to the project service stated');

    const isOrgIdExist = await this.orgRepo.findOrgById(organizationId);

    if (!isOrgIdExist) {
      throw new ApiError(404, 'Organization not found');
    }

    const isProjectExist = await this.projectRepo.isProjectExist(projectId);

    if (!isProjectExist) {
      throw new ApiError(404, 'Project not found');
    }

    const isTargetUserExist = await this.authRepo.findUserById(targetUserId);

    if (!isTargetUserExist) {
      throw new ApiError(500, 'Target user or mangager is does not exsit');
    }

    // const isManager = await this.projectRepo.checkRole(
    //   organizationId,
    //   targetUserId,
    // );

    // console.log("---------------------",isManager);

    // if (!isManager) {
    //   throw new ApiError(
    //     403,
    //     'this member is not exist in this orgnaizations, admin need to be add first in this organizations.',
    //   );
    // }

    // if (!(isManager?.roleId == 2)) {
    //   throw new ApiError(
    //     403,
    //     'u can not assign any other member to poject , project only assign to a manager only .',
    //   );
    // }

    const result = await this.projectRepo.assignManagerToProject(
      projectId,
      organizationId,
      targetUserId,
      adminUserId,
    );

    this.activityService.logActivity({
      userId: targetUserId,
      organizationId: result?.organizationId,
      action: 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: result?.id.toString(),
      details: {
        projectName: result?.name,
        status: 'Manager assigned successffully',
        userAssign: adminUserId,
        managerOfTheProject: targetUserId,
      },
      ipAddress: ip,
      userAgent: userAgent,
    });

    logger.info('admin add manager successfully');

    return result;
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

    logger.info('Archived project successfully in service layer.');

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

    logger.info('Deleting project successfully in service layer');

    return { message: 'Project deleted successfully' };
  }

  async addTeamMember(
    projectId: number,
    addedBy: number,
    targetUserId: number,
  ) {
    logger.info('Adding team member', { projectId, targetUserId });

    const project = await this.projectRepo.findProjectById(projectId);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    const targetUser = await this.authRepo.findUserById(targetUserId);
    if (!targetUser) {
      throw new ApiError(404, 'User not found');
    }

    if (targetUser.organizationId !== project.organizationId) {
      throw new ApiError(
        400,
        'User must be in the same organization as the project',
      );
    }

    const isAlreadyMember = await this.projectRepo.isTeamMember(
      projectId,
      targetUserId,
    );
    if (isAlreadyMember) {
      throw new ApiError(400, 'User is already a team member of this project');
    }

    // const roleOfMember = await this.projectRepo.checkRole(
    //   project.organizationId,
    //   targetUserId,
    // );

    // if (!roleOfMember) {
    //   throw new ApiError(
    //     403,
    //     'Admin needs to add this user to the organization first.',
    //   );
    // }

    // const memberLevel = roleOfMember.roleId;
    // const allowedLevels = [2, 3, 4, 5];

    // if (!allowedLevels.includes(memberLevel)) {
    //   throw new ApiError(
    //     403,
    //     'This role cannot be added as a project team member.',
    //   );
    // }

    const member = await this.projectRepo.addTeamMember(
      projectId,
      targetUserId,
      project.organizationId,
      addedBy,
    );

    await this.activityService.logActivity({
      userId: addedBy,
      organizationId: project.organizationId,
      action: 'PROJECT_UPDATED',
      entityType: 'project',
      entityId: projectId.toString(),
      details: {
        action: 'team_member_added',
        targetUserId,
      },
    });

    return { member };
  }

  async removeTeamMember(
    projectId: number,
    userId: number,
    targetUserId: number,
    organizationId: number,
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

    await this.projectRepo.removeTeamMember(
      projectId,
      targetUserId,
      organizationId,
    );

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
