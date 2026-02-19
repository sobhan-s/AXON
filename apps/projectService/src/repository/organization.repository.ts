import { logger } from '@dam/config';
import { prisma } from '../index.js';
import { ApiError } from '@dam/utils';

export class OrganizationRepositories {
  async createOrganizations(
    superAdminId: number,
    data: {
      name: string;
      slug: string;
      description: string;
    },
  ) {
    try {
      logger.info(' Creating organization in database', {
        superAdminId,
        data,
      });

      return await prisma.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          createdBy: superAdminId,
          assignedTo: null,
          status: 'ACTIVE',
        },
      });
    } catch (error) {
      logger.error('Error creating organization', { error });
      throw new ApiError(500, 'Database error while creating organization');
    }
  }

  async assignToOrgs(organizationId: number, adminId: number) {
    try {
      const result = await prisma.organization.update({
        where: { id: organizationId },
        data: { assignedTo: adminId },
      });

      await prisma.user.update({
        where: { id: adminId },
        data: { organizationId: organizationId },
      });

      return result;
    } catch (error) {
      logger.error('Error in assign the admin to organization', { error });
      throw new ApiError(
        500,
        'Database error while assign the admin to organization',
      );
    }
  }

  async findUser(email: string) {
    try {
      logger.info('Finding the user in repo via email', { email });
      return await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          isEmailVerified: true,
          organizationId: true,
          email: true,
          username: true,
        },
      });
    } catch (error) {
      logger.error('Error in finding users', { error });
      throw new ApiError(500, 'Database error while finding the user');
    }
  }

  async findOrgsBySlugs(slug: string) {
    try {
      return await prisma.organization.findUnique({
        where: { slug },
      });
    } catch (error) {
      logger.error(' Error finding organization', { error });
      throw new ApiError(500, 'Database error while finding organization');
    }
  }

  async findOrgById(id: number) {
    try {
      return await prisma.organization.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          assignee: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          _count: {
            select: {
              projects: true,
              users: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error finding organization', { error });
      throw new ApiError(500, 'Database error');
    }
  }

  async getAllOrganizations() {
    try {
      return await prisma.organization.findMany({
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          assignee: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          _count: {
            select: {
              projects: true,
              users: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching organizations', { error });
      throw new ApiError(500, 'Database error');
    }
  }
}
