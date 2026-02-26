import { prisma } from '../index.js';
import { ApiError } from '@dam/utils';
import { logger } from '@dam/config';

export class UserRepository {
  async updateUser(
    id: number,
    data: Partial<{
      username: string;
    }>,
  ) {
    try {
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Error updating user', { error });
      throw new ApiError(500, 'Database error while updating user');
    }
  }

  async deleteme(userId: number) {
    try {
      return await prisma.user.delete({
        where: {
          id: userId,
        },
      });
    } catch (error) {
      logger.error('Error in deleting user', { error });
      throw new ApiError(500, 'Database error while delete user');
    }
  }

  async updatePassword(userId: number, newHashPassword: string) {
    try {
      return await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password: newHashPassword,
        },
      });
    } catch (error) {
      logger.error('Error in updation of password of user', { error });
      throw new ApiError(500, 'Database error while updating user password');
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

  async getOrganizationMembers(orgId: number) {
    try {
      return await prisma.projectTeamMember.findMany({
        where: { organizationId: orgId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              avatarUrl: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              level: true,
              description: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { addedAt: 'asc' },
      });
    } catch (error) {
      logger.error('Error fetching org members', { error });
      throw new ApiError(500, 'Error fetching org members');
    }
  }

  async addUsersToOrganizations(
    addedBy: number,
    orgId: number,
    data: {
      username: string;
      email: string;
      password: string;
      roleId: number;
    },
  ) {
    try {
      logger.info('Creating user and adding to organization');

      return prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: data.email,
            username: data.username,
            password: data.password,
            isEmailVerified: true,
            organizationId: orgId,
          },
          select: {
            id: true,
            email: true,
            username: true,
          },
        });

        await tx.projectTeamMember.create({
          data: {
            organizationId: orgId,
            userId: createdUser.id,
            addedBy: addedBy,
            roleId: data.roleId,
          },
        });

        return createdUser;
      });
    } catch (error) {
      logger.error('Error creating user at admin level', { error });
      throw new ApiError(
        500,
        'Database error while creating user at admin level',
      );
    }
  }

  async removeUsersToOrganizations(userId: number, orgId: number) {
    try {
      logger.info('Removing user from organization');

      return await prisma.$transaction(async (tx) => {
        await tx.projectTeamMember.deleteMany({
          where: {
            userId: userId,
            organizationId: orgId,
          },
        });

        const deletedUser = await tx.user.delete({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            email: true,
          },
        });

        return deletedUser;
      });
    } catch (error) {
      logger.error('Error removing user from organization', { error });
      throw new ApiError(
        500,
        'Database error while removing user from organization',
      );
    }
  }

  async getParticularUser(userId: number) {
    try {
      logger.info('Fetching particular user info');

      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          username: true,
          email: true,
          organizationId: true,
          avatarUrl: true,
          isActive: true,
          organization: {
            select: {
              name: true,
              description: true,
              status: true,
              teamMembers: {
                select: {
                  role: {
                    select: { name: true },
                  },
                  user: {
                    select: {
                      email: true,
                      username: true,
                      isActive: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching user profile', { error });
      throw new ApiError(500, 'Database error while fetching user profile');
    }
  }

  async updateUserProfileAdminLevel(
    organizationId: number,
    data: Partial<{
      email: string;
      username: string;
      isActive: boolean;
      roleId: number;
      projectId?: number;
    }>,
  ) {
    try {
      logger.info('Updating user details at admin level');

      return await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { email: data.email },
          data: {
            username: data.username,
            isActive: data.isActive,
          },
          select: {
            id: true,
            email: true,
            username: true,
            isActive: true,
          },
        });

        if (data.roleId) {
          if (data.projectId) {
            await tx.projectTeamMember.update({
              where: {
                projectId_userId: {
                  projectId: data.projectId,
                  userId: updatedUser.id,
                },
              },
              data: { roleId: data.roleId },
            });
          } else {
            await tx.projectTeamMember.updateMany({
              where: {
                userId: updatedUser.id,
                organizationId: organizationId,
                projectId: null,
              },
              data: { roleId: data.roleId },
            });
          }
        }

        return updatedUser;
      });
    } catch (error) {
      logger.error('Error updating user details at admin level', { error });
      throw new ApiError(
        500,
        'Database error while updating user details at admin level',
      );
    }
  }
}
