// import { logger } from '@dam/config';
// import { ProjectRepository } from '../repository/project.repository.js';
// import { ApiError } from '@dam/utils';
// import { ActivityService } from '@dam/common';

// export class OrganizationServices {
//   private projectRepo: ProjectRepository;
//   private activityService: ActivityService;

//   constructor() {
//     this.projectRepo = new ProjectRepository();
//     this.activityService = new ActivityService();
//   }

//   async createProjects(
//     adminId: number,
//     organizationId: number,
//     ip: string,
//     userAgent: string,
//     data: {
//       name: string;
//       slug: string;
//       description?: string;
//     },
//   ) {
//     logger.info('Project creation service started', {
//       adminId,
//       data,
//     });

//     const existingOrg = await this.projectRepo.findProjectBySlugs(
//       organizationId,
//       data.slug,
//     );
//     if (existingOrg) {
//       throw new ApiError(
//         409,
//         'project with this slug already exists. Please choose a different slug.',
//       );
//     }

//     const createdOrg = await this.projectRepo.createProject(adminId,organizationId, {
//       name: data.name,
//       slug: data.slug,
//       description: data.description || '',
//     });

//     logger.info('project created', { organizationId: createdProject.id });

//     await this.activityService.logActivity({
//       userId: superAdminId,
//       organizationId: createdOrg.id,
//       action: 'ORG_CREATED',
//       entityType: 'organization',
//       entityId: createdOrg.id.toString(),
//       details: {
//         orgName: createdOrg.name,
//         description: createdOrg.description,
//         status: 'No admin assigned yet',
//       },
//       ipAddress: ip,
//     });

//     logger.info('Organization creation complete');

//     return {
//       organization: {
//         ...createdOrg,
//         storageLimit: createdOrg.storageLimit.toString(),
//         storageUsed: createdOrg.storageUsed.toString(),
//       },
//     };
//   }
// }
