import { logger } from '@dam/config';
import { prisma } from '../index.js';
import { ApiError } from '@dam/utils';

export class ProjectRepository {
  async createProject(
    adminId: number,
    organizationId: number,
    data: {
      name: string;
      slug: string;
      description: string;
    },
  ) {
    try {
      logger.info(' Creating organization in database', {
        adminId,
        data,
      });

      return await prisma.project.create({
        data: {
          name: data.name,
          description: data.description,
          slug: data.slug,
          createdBy: adminId,
          organizationId: organizationId,
        },
      });
    } catch (error) {
      logger.error('Error creating project under organizations', { error });
      throw new ApiError(
        500,
        'Database error while creating project under organizations',
      );
    }
  }

  async findProjectBySlugs(organizationId: number, slug: string) {
    try {
      logger.info('Find by project by slugs serice called . . .');

      return await prisma.project.findUnique({
        where: {
          organizationId_slug: {
            organizationId,
            slug,
          },
        },
      });
    } catch (error) {
      logger.error('Error finding project by slug', { error });
      throw new ApiError(500, 'Error finding project by slug');
    }
  }
}
