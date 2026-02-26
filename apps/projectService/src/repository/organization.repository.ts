import { logger } from '@dam/config';
import { prisma } from '../index.js';
import { ApiError } from '@dam/utils';
import { OrganizationStatus } from '@dam/postgresql_db';

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

  async updateOrganizations(
    organizationId: number,
    data: Partial<{
      name: string;
      description: string;
      storageLimit: string;
    }>,
  ) {
    try {
      logger.info('Organization updation in repository');
      return await prisma.organization.update({
        where: { id: organizationId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.storageLimit && { storageLimit: BigInt(data.storageLimit) }),
        },
      });
    } catch (error) {
      logger.error('Error updating in organization', { error });
      throw new ApiError(500, 'Database error while update the organization');
    }
  }

  async assignToOrgs(
    organizationId: number,
    adminId: number,
    superAdminId: number,
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        const result = await tx.organization.update({
          where: { id: organizationId },
          data: { assignedTo: adminId },
        });

        await tx.user.update({
          where: { id: adminId },
          data: { organizationId: organizationId },
        });

        const existingMembership = await tx.projectTeamMember.findFirst({
          where: {
            userId: adminId,
            organizationId: organizationId,
            projectId: null,
          },
          select: { id: true },
        });

        if (existingMembership) {
          await tx.projectTeamMember.update({
            where: { id: existingMembership.id },
            data: { roleId: 1 },
          });
        } else {
          await tx.projectTeamMember.create({
            data: {
              organizationId: organizationId,
              userId: adminId,
              addedBy: superAdminId,
              roleId: 1,
            },
          });
        }

        return result;
      });
    } catch (error: any) {
      logger.error('Error assigning admin to organization', { error });
      if (error.code === 'P2025') {
        throw new ApiError(404, 'Organization or User not found');
      }
      throw new ApiError(
        500,
        'Database error while assigning the admin to organization',
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
      throw new ApiError(
        500,
        'Database error while fetching all organizations .',
      );
    }
  }

  async deleteOrganization(organizationId: number) {
    try {
      logger.info('delete organization stated in repository');
      return await prisma.organization.delete({
        where: { id: organizationId },
      });
    } catch (error) {
      logger.error('Error deleting organizations', { error });
      throw new ApiError(500, 'Database error while deleteing organizations .');
    }
  }

  async unAssignAdmin(organizationId: number, assignAdmin: number) {
    try {
      logger.info('Un assign admin from the organizations in reppo');

      return prisma.$transaction(async (tx) => {
        const result = await tx.organization.update({
          where: {
            id: organizationId,
          },
          data: {
            assignedTo: null,
          },
        });

        if (result.assignedTo) {
          throw new ApiError(403, 'From organization assign id not removed ');
        }

        await tx.user.update({
          where: {
            id: assignAdmin,
          },
          data: {
            organizationId: null,
          },
        });

        await tx.projectTeamMember.deleteMany({
          where: {
            organizationId: organizationId,
            userId: assignAdmin,
          },
        });

        return result;
      });
    } catch (error) {
      logger.error('Error in unassign form organizations', { error });
      throw new ApiError(
        500,
        'Database error while unassign from organizations .',
      );
    }
  }

  async changeStatus(organizationId: number, status: OrganizationStatus) {
    // console.log((status as any).status);
    // console.log(typeof (status as any).status);

    const sts = (status as any)?.status;
    try {
      logger.info('change staus service called in repo');
      return await prisma.organization.update({
        where: {
          id: organizationId,
        },
        data: {
          status: sts,
        },
      });
    } catch (error) {
      logger.error('Error in changing status of organizations', { error });
      throw new ApiError(
        500,
        'Database error while changing status of organizations .',
      );
    }
  }

  async addToOrgs(
    organizationId: number,
    targetedUserId: number,
    userId: number,
    roleId: number,
  ) {
    try {
      logger.info('add to organizaition in repo layer.');
      return await prisma.$transaction(async (tx) => {
        await tx.projectTeamMember.create({
          data: {
            organizationId: organizationId,
            userId: targetedUserId,
            addedBy: userId,
            roleId: roleId,
          },
        });

        return await tx.user.update({
          where: {
            id: targetedUserId,
          },
          data: {
            organizationId: organizationId,
          },
          select: {
            email: true,
            organizationId: true,
            projectTeamMembers: {
              select: {
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });
      });
    } catch (error) {
      logger.error('Error in Adding to the organization', { error });
      throw new ApiError(
        500,
        'Database error while Adding to the organization .',
      );
    }
  }
}
