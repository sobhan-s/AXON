import { SUPER_ADMIN_ORG_ENDPOINTS } from '@/lib/api-endpints';
import axios from 'axios';

const userService = {
  async requestOrg(requetedUserMail: string, orgName: string, orgSlug: string) {
    const {data} = await axios.post(SUPER_ADMIN_ORG_ENDPOINTS.REQUEST_ORG, {
      requetedUserMail,
      orgName,
      orgSlug,
    });

    return data.result
  },
};

export { userService };
