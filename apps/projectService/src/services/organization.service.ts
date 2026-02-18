import { logger } from '@dam/config';
import { OrganizationRepositories } from '../repository/organization.repository.js';
import { ApiError } from '@dam/utils';
import { ActivityService } from '@dam/common';

export class OrganizationServices {
  private orgRepo: OrganizationRepositories;
  private activityService: ActivityService;

  constructor() {
    this.orgRepo = new OrganizationRepositories();
    this.activityService = new ActivityService();
  }

  async createOrgs(
    userId: number,
    ip: string,
    data: {
      name: string;
      slug: string;
      description: string;
    },
  ) {
    logger.info('Organization is creatation has been started : service', {
      userId,
      ip,
      data,
    });

    const isOrgExist = await this.orgRepo.findOrgsBySlugs(data.slug as string);

    if (isOrgExist) {
      throw new ApiError(
        400,
        'Organization name is exist, please give a new slug . . .',
      );
    }

    const createdOrgs = await this.orgRepo.createOrganizations(userId, data);

    this.activityService.logActivity({
      userId: userId,
      organizationId: createdOrgs.id,
      action: 'ORG_CREATED',
      entityType: 'org',
      entityId: createdOrgs.id.toString(),
      details: {
        orgName: createdOrgs.name,
        descriptions: createdOrgs.description,
      },
      ipAddress: ip,
    });

    logger.info('Organization created successfully .', { createdOrgs });

    return {
      createdOrgs,
    };
  }
}
