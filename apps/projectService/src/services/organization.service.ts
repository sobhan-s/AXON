import { logger } from '@dam/config';
import { OrganizationRepositories } from '../repository/organization.repository.js';
import { ApiError } from '@dam/utils';
import { ActivityService } from '@dam/common';
import { OrganizationStatus } from '@dam/postgresql_db';

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

    // if (organization.assignedTo) {
    //   throw new ApiError(400, 'Organization already has an admin.');
    // }

    if (organization.assignedTo) {
      await this.unAssignFromOrganization(superAdminId, organizationId);
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
      superAdminId,
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

    const result = organizations.map((org) => {
      return {
        ...org,
        storageLimit: org.storageLimit.toString(),
        storageUsed: org.storageUsed.toString(),
      };
    });

    logger.info('fetched All organization successfully service', {
      result,
    });
    return {
      result,
    };
  }

  async getOrganizationById(organizationId: number) {
    logger.info('Fetching organization', { organizationId });

    const organization = await this.orgRepo.findOrgById(organizationId);

    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    logger.info('fetched organization successfully service');

    return {
      organization: {
        ...organization,
        storageLimit: organization.storageLimit.toString(),
        storageUsed: organization.storageUsed.toString(),
      },
    };
  }

  async updateOrganization(
    organizationId: number,
    data: {
      name?: string;
      description?: string;
      storageLimit?: string;
    },
    userId: number,
    ip: string,
    userAgent: string,
  ) {
    logger.info('Updating organization', { organizationId, data, userId });

    const organization = await this.orgRepo.findOrgById(organizationId);
    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    const updatedOrg = await this.orgRepo.updateOrganizations(
      organizationId,
      data,
    );

    logger.info('Organization updated', { organizationId: updatedOrg.id });

    await this.activityService.logActivity({
      userId: userId,
      organizationId: updatedOrg.id,
      action: 'ORG_UPDATED',
      entityType: 'organization',
      entityId: updatedOrg.id.toString(),
      details: {
        orgName: data.name,
        description: data.description,
        storgeLimit: data.storageLimit,
        changedOrgName: updatedOrg.name,
        changedDescription: updatedOrg.description,
        chnagedStorgeLimit: updatedOrg.storageLimit?.toString(),
      },
      ipAddress: ip,
      userAgent: userAgent,
    });

    logger.info('Organization updation complete');

    return {
      organization: {
        ...updatedOrg,
        storageLimit: updatedOrg.storageLimit.toString(),
        storageUsed: updatedOrg.storageUsed.toString(),
      },
    };
  }

  async deleteOrganization(
    superAdminId: number,
    organizationId: number,
    ip: string,
    userAgent: string,
  ) {
    logger.info('Deleting organization', { superAdminId, organizationId });

    const organization = await this.getOrganizationById(organizationId);
    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    const assignId = organization.organization.assignedTo;

    if (assignId) {
      throw new ApiError(
        403,
        'Before delete the organization , u have to remove the assign of organization admin . . .',
      );
    }

    this.orgRepo.deleteOrganization(organizationId);

    await this.activityService.logActivity({
      userId: superAdminId,
      organizationId: organization.organization.id,
      action: 'ORG_DELETED',
      entityType: 'organization',
      entityId: organization.organization.id.toString(),
      details: {
        orgName: organization.organization.name,
        deletedBy: superAdminId,
      },
      ipAddress: ip,
      userAgent: userAgent,
    });

    logger.info('Organization deleted', { organizationId });

    return { message: 'Organization deleted successfully' };
  }

  async unAssignFromOrganization(superAdminId: number, organizationId: number) {
    logger.info('remove the admin from organization', {
      superAdminId,
      organizationId,
    });

    const organisations = await this.getOrganizationById(organizationId);

    if (!organisations) {
      throw new ApiError(404, 'can not find the organizations');
    }

    const assignAdmin = organisations.organization.assignedTo as number;

    if (!assignAdmin) {
      throw new ApiError(404, 'can not find the admin');
    }

    const org = await this.orgRepo.unAssignAdmin(organizationId, assignAdmin);

    if (org.assignedTo) {
      throw new ApiError(
        403,
        'from organization assignadmin is not removed yet . . .',
      );
    }

    this.activityService.logActivity({
      userId: superAdminId,
      organizationId: org.id,
      action: 'ORG_UPDATED',
      entityType: 'organization',
      entityId: org.id.toString(),
      details: {
        message: 'super admin removed organization admin successfully',
      },
    });

    logger.info(`Admin removed from organization`, {
      organizationId,
      superAdminId,
      removedAdminId: assignAdmin,
    });

    return {
      organisations: {
        ...org,
        storageLimit: org.storageLimit.toString(),
        storageUsed: org.storageUsed.toString(),
      },
    };
  }

  async changeStautus(
    organisationsId: number,
    status: OrganizationStatus,
    ip: string,
    userAgent: string,
  ) {
    logger.info('Chnage status service called');

    const orgs = await this.orgRepo.findOrgById(organisationsId);

    if (!orgs) {
      throw new ApiError(404, 'Organization is not found');
    }

    const result = await this.orgRepo.changeStatus(orgs.id, status);

    if (result.status == status) {
      throw new ApiError(500, 'Error while changing status of organizations');
    }

    logger.info('Organization status chnaged successdfully . . .');

    this.activityService.logActivity({
      userId: orgs.creator.id,
      organizationId: orgs.id,
      action: 'ORG_UPDATED',
      entityType: 'organization',
      entityId: orgs.id.toString(),
      details: {
        orgName: orgs.name,
        changedStatusFrom: orgs.status,
        changedstatusTo: result.status,
      },
      ipAddress: ip,
      userAgent: userAgent,
    });

    return {
      organization: {
        ...result,
        storageLimit: result.storageLimit.toString(),
        storageUsed: result.storageUsed.toString(),
      },
    };
  }
}
