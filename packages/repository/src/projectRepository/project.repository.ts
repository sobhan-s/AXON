import { logger } from '@dam/config';
import { PostgresClient as prisma } from '@dam/postgresql_db';
import { ApiError } from '@dam/utils';
import { ProjectStatus } from '@dam/postgresql_db';

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
      logger.info('Creating project in database', { adminId, data });

      return await prisma.$transaction(async (tx) => {
        const createProject = await tx.project.create({
          data: {
            name: data.name,
            description: data.description,
            slug: data.slug,
            createdBy: adminId,
            organizationId: organizationId,
          },
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
          // Admin already has an org-level record . . . update it with the new projectId
          await tx.projectTeamMember.update({
            where: { id: existingMembership.id },
            data: { projectId: createProject.id },
          });
        } else {
          await tx.projectTeamMember.create({
            data: {
              organizationId: organizationId,
              projectId: createProject.id,
              userId: adminId,
              addedBy: adminId,
              roleId: 1,
            },
          });
        }

        return createProject;
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
      logger.info('Finding project by slug');

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

  async findProjectById(projectId: number) {
    try {
      return await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          creator: {
            select: { id: true, email: true, username: true },
          },
          assignee: {
            select: { id: true, email: true, username: true },
          },
          organization: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: {
              tasks: true,
              teamMembers: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error finding project', { error });
      throw new ApiError(500, 'Error finding project');
    }
  }

  async getAllProjects(organizationId: number) {
    try {
      return await prisma.project.findMany({
        where: { organizationId },
        include: {
          creator: {
            select: { id: true, email: true, username: true },
          },
          assignee: {
            select: { id: true, email: true, username: true },
          },
          _count: {
            select: {
              // FIXED: removed modules . . . replaced with tasks
              tasks: true,
              teamMembers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching projects', { error });
      throw new ApiError(500, 'Error fetching projects');
    }
  }

  async getUserProjects(userId: number) {
    try {
      return await prisma.project.findMany({
        where: {
          teamMembers: {
            some: { userId },
          },
        },
        include: {
          creator: {
            select: { id: true, email: true, username: true },
          },
          organization: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: {
              // FIXED: removed modules . . . replaced with tasks
              tasks: true,
              teamMembers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching user projects', { error });
      throw new ApiError(500, 'Error fetching user projects');
    }
  }

  async updateProject(
    projectId: number,
    data: Partial<{
      name?: string;
      description?: string;
      status?: ProjectStatus;
      startDate?: Date;
      endDate?: Date;
    }>,
  ) {
    try {
      return await prisma.project.update({
        where: { id: projectId },
        data: {
          name: data.name,
          description: data.description,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
        },
        include: {
          creator: {
            select: { id: true, email: true, username: true },
          },
          assignee: {
            select: { id: true, email: true, username: true },
          },
        },
      });
    } catch (error) {
      logger.error('Error updating project', { error });
      throw new ApiError(500, 'Error updating project');
    }
  }

  async assignManagerToProject(
    projectId: number,
    organizationId: number,
    managerId: number,
    adminUserId: number,
  ) {
    try {
      logger.info('Assigning manager to project in repository');

      return await prisma.$transaction(async (tx) => {
        const updatedProject = await tx.project.update({
          where: { id: projectId },
          data: { assignedTo: managerId },
          select: {
            id: true,
            assignedTo: true,
            name: true,
            organizationId: true,
          },
        });

        const existingMembership = await tx.projectTeamMember.findFirst({
          where: {
            userId: managerId,
            organizationId: organizationId,
            projectId: null,
          },
          select: { id: true },
        });

        if (existingMembership) {
          await tx.projectTeamMember.update({
            where: { id: existingMembership.id },
            data: { projectId },
          });
        } else {
          await tx.projectTeamMember.create({
            data: {
              organizationId,
              projectId,
              userId: managerId,
              addedBy: adminUserId,
              roleId: 2,
            },
          });
        }

        return updatedProject;
      });
    } catch (error) {
      logger.error('Error assigning manager to project', { error });
      throw new ApiError(500, 'Error assigning manager to project');
    }
  }

  async archiveProject(projectId: number) {
    try {
      return await prisma.project.update({
        where: { id: projectId },
        data: {
          isArchived: true,
          status: 'ARCHIVED',
        },
      });
    } catch (error) {
      logger.error('Error archiving project', { error });
      throw new ApiError(500, 'Error archiving project');
    }
  }

  async deleteProject(projectId: number) {
    try {
      return await prisma.project.delete({
        where: { id: projectId },
      });
    } catch (error) {
      logger.error('Error deleting project', { error });
      throw new ApiError(500, 'Error deleting project');
    }
  }

  async addTeamMember(
    projectId: number,
    userId: number,
    organizationId: number,
    addedBy: number,
  ) {
    try {
      return await prisma.$transaction(async (tx) => {
        const existingOrgMembership = await tx.projectTeamMember.findFirst({
          where: {
            userId,
            organizationId,
            projectId: null,
          },
          select: { id: true, roleId: true },
        });

        if (existingOrgMembership) {
          return await tx.projectTeamMember.update({
            where: { id: existingOrgMembership.id },
            data: { projectId },
          });
        }

        const anyMembership = await tx.projectTeamMember.findFirst({
          where: { userId, organizationId },
          select: { roleId: true },
        });

        return await tx.projectTeamMember.create({
          data: {
            organizationId,
            projectId,
            userId,
            addedBy,
            roleId: anyMembership!.roleId,
          },
        });
      });
    } catch (error) {
      logger.error('Error adding team member', { error });
      throw new ApiError(500, 'Error adding team member');
    }
  }

  async removeTeamMember(
    projectId: number,
    userId: number,
    organizationId: number,
  ) {
    try {
      return await prisma.projectTeamMember.update({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
          organizationId,
        },
        data: {
          projectId: null,
        },
      });
    } catch (error) {
      logger.error('Error removing team member', { error });
      throw new ApiError(500, 'Error removing team member');
    }
  }

  async getTeamMembers(projectId: number) {
    try {
      return await prisma.projectTeamMember.findMany({
        where: { projectId },
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
        },
        orderBy: { addedAt: 'asc' },
      });
    } catch (error) {
      logger.error('Error fetching team members', { error });
      throw new ApiError(500, 'Error fetching team members');
    }
  }

  async isTeamMember(projectId: number, userId: number): Promise<boolean> {
    try {
      const member = await prisma.projectTeamMember.findFirst({
        where: { projectId, userId },
      });
      return !!member;
    } catch (error) {
      return false;
    }
  }

  async isProjectExist(projectId: number) {
    try {
      return await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
        },
      });
    } catch (error) {
      logger.error('Error finding project', { error });
      throw new ApiError(500, 'Error finding project');
    }
  }

  async checkRoleInProject(projectId: number, userId: number) {
    try {
      return await prisma.projectTeamMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
        select: {
          role: {
            select: {
              name: true,
              level: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error checking role in project', { error });
      throw new ApiError(500, 'Error checking role in project');
    }
  }

  async checkRole(organizationId: number, userId: number) {
    try {
      return await prisma.projectTeamMember.findFirst({
        where: {
          userId,
          organizationId,
          projectId: null,
        },
      });
    } catch (error) {
      logger.error('Error in finding check role');
      throw new ApiError(500, 'Error in finding check role');
    }
  }
}
