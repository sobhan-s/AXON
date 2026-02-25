import { logger } from '@dam/config';
import { prisma } from '../index.js';
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
      logger.info(' Creating organization in database', {
        adminId,
        data,
      });

      return await prisma.$transaction(async (tx) => {
        const orgsInProjectMember = await tx.projectTeamMember.findFirst({
          where: {
            organizationId: organizationId,
          },
          select: {
            id: true,
          },
        });

        const createProject = await tx.project.create({
          data: {
            name: data.name,
            description: data.description,
            slug: data.slug,
            createdBy: adminId,
            organizationId: organizationId,
          },
        });

        await tx.projectTeamMember.update({
          where: {
            id: orgsInProjectMember?.id,
          },
          data: {
            projectId: createProject.id,
          },
        });

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
              modules: true,
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
              modules: true,
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
            some: {
              userId: userId,
            },
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
              modules: true,
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
      assignedTo?: number;
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
    roleId: number,
    addedBy: number,
    organizationId: number,
  ) {
    try {
      return await prisma.projectTeamMember.create({
        data: {
          projectId,
          userId,
          roleId,
          addedBy,
          organizationId,
        },
        include: {
          user: {
            select: { id: true, email: true, username: true },
          },
          role: {
            select: { id: true, name: true, level: true },
          },
        },
      });
    } catch (error) {
      logger.error('Error adding team member', { error });
      throw new ApiError(500, 'Error adding team member');
    }
  }

  async removeTeamMember(projectId: number, userId: number) {
    try {
      return await prisma.projectTeamMember.deleteMany({
        where: {
          projectId,
          userId,
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
}
