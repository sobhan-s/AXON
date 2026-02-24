import { logger } from '@dam/config';
import { ProjectRepository } from '../repository/project.repository.js';
import { ApiError } from '@dam/utils';
import { ActivityService } from '@dam/common';

export class ProjectServices {
  private projectRepo: ProjectRepository;
  private activityService: ActivityService;

  constructor() {
    this.projectRepo = new ProjectRepository();
    this.activityService = new ActivityService();
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
}
