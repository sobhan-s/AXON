import { logger } from '@dam/config';
import { prisma } from '../index.js';
import { ApiError } from '@dam/utils';

export class OrganizationRepositories {
  async createOrganizations(
    userId: number,
    data: {
      name: string;
      slug: string;
      description: string;
    },
  ) {
    try {
      logger.info('creation of organization:repository', { userId, data });
      return prisma.organization.create({
        data: {
          createdBy: userId,
          name: data.name,
          slug: data.slug,
          description: data.description,
          users: {
            connect: {
              id: userId,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error during creation of organizations', { error });
      throw new ApiError(500, 'Database error while creating Organizations');
    }
  }

  async findOrgsBySlugs(slug: string) {
    try {
      logger.info('find orgs by there slugs', { slug });
      return prisma.organization.findUnique({
        where: {
          slug,
        },
      });
    } catch (error) {
      logger.error('Error during creation of organizations', { error });
      throw new ApiError(500, 'Database error while creating Organizations');
    }
  }
}
