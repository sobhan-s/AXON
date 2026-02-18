import { IRouter, Router } from 'express';
import { createOrganizations } from '../controller/organization.controller.js';
import { validate } from '@dam/middlewares';
import { createOrgsSchemas } from '@dam/validations';

const router: IRouter = Router();

router.route('/create').post(validate(createOrgsSchemas), createOrganizations);

export default router;
