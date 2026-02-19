import { logger } from '@dam/config';
import { OrganizationRepositories } from '../repository/organization.repository.js';
import { ApiError } from '@dam/utils';
import { ActivityService } from '@dam/common';
import { prisma } from '../index.js';

export class OrganizationServices {
  private orgRepo: OrganizationRepositories;
  private activityService: ActivityService;

  constructor() {
    this.orgRepo = new OrganizationRepositories();
    this.activityService = new ActivityService();
  }

  async createOrgs(
    superAdminId: number,
    ip: string,
    data: {
      name: string;
      slug: string;
      description?: string;
    },
  ) {
    logger.info('Organization creation service started', {
      superAdminId,
      data,
    });

    const existingOrg = await this.orgRepo.findOrgsBySlugs(data.slug);
    if (existingOrg) {
      throw new ApiError(
        409,
        'Organization with this slug already exists. Please choose a different slug.',
      );
    }

    const createdOrg = await this.orgRepo.createOrganizations(superAdminId, {
      name: data.name,
      slug: data.slug,
      description: data.description || '',
    });

    logger.info('Organization created', { organizationId: createdOrg.id });

    await this.activityService.logActivity({
      userId: superAdminId,
      organizationId: createdOrg.id,
      action: 'ORG_CREATED',
      entityType: 'organization',
      entityId: createdOrg.id.toString(),
      details: {
        orgName: createdOrg.name,
        description: createdOrg.description,
        status: 'No admin assigned yet',
      },
      ipAddress: ip,
    });

    logger.info('Organization creation complete');

    return {
      organization: {
        ...createdOrg,
        storageLimit: createdOrg.storageLimit.toString(),
        storageUsed: createdOrg.storageUsed.toString(),
      },
    };
  }

  async assignAdmin(
    superAdminId: number,
    organizationId: number,
    adminEmail: string,
    ip: string,
  ) {
    logger.info(' Assigning admin to organization', {
      superAdminId,
      organizationId,
      adminEmail,
    });

    const organization = await this.orgRepo.findOrgById(organizationId);
    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    if (organization.assignedTo) {
      throw new ApiError(
        400,
        'Organization already has an admin. Use update endpoint to change admin.',
      );
    }

    const adminUser = await this.orgRepo.findUser(adminEmail);

    if (!adminUser) {
      throw new ApiError(
        404,
        `User with email ${adminEmail} not found. Please ensure the user is registered first.`,
      );
    }

    if (adminUser.organizationId) {
      throw new ApiError(
        400,
        'This user already belongs to another organization',
      );
    }

    if (!adminUser.isEmailVerified) {
      throw new ApiError(
        400,
        'User must verify their email before being assigned as admin',
      );
    }

    const updatedOrg = await this.orgRepo.assignToOrgs(
      organizationId,
      adminUser.id,
    );

    logger.info('Admin assigned to organization', {
      userId: adminUser.id,
      organizationId,
    });

    await this.activityService.logActivity({
      userId: superAdminId,
      organizationId: organizationId,
      action: 'ORG_UPDATED',
      entityType: 'organization',
      entityId: organizationId.toString(),
      details: {
        action: 'admin_assigned',
        adminEmail: adminEmail,
        adminUserId: adminUser.id,
      },
      ipAddress: ip,
    });

    return {
      organization: {
        ...updatedOrg,
        storageLimit: updatedOrg.storageLimit.toString(),
        storageUsed: updatedOrg.storageUsed.toString(),
      },
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        username: adminUser.username,
      },
    };
  }

  async getAllOrganizations(superAdminId: number) {
    logger.info('Fetching all organizations', { superAdminId });

    const organizations = await this.orgRepo.getAllOrganizations();

    return { organizations };
  }

  async getOrganizationById(organizationId: number) {
    logger.info('Fetching organization', { organizationId });

    const organization = await this.orgRepo.findOrgById(organizationId);

    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    return { organization };
  }

  async updateOrganization(
    organizationId: number,
    data: {
      name?: string;
      description?: string;
      storageLimit?: number;
    },
  ) {
    logger.info('Updating organization', { organizationId, data });

    const organization = await this.orgRepo.findOrgById(organizationId);
    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.storageLimit && { storageLimit: BigInt(data.storageLimit) }),
      },
    });

    return { organization: updated };
  }

  async deleteOrganization(superAdminId: number, organizationId: number) {
    logger.info('Deleting organization', { superAdminId, organizationId });

    const organization = await this.orgRepo.findOrgById(organizationId);
    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    await prisma.organization.delete({
      where: { id: organizationId },
    });

    logger.info('Organization deleted', { organizationId });

    return { message: 'Organization deleted successfully' };
  }
}
