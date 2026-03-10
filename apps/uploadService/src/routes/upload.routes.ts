import { IRouter, Router } from 'express';
import { tusServer } from '../service/upload.service.js';

const router: IRouter = Router();

router.all('/upload', (req, res) => tusServer.handle(req, res));

router.all('/upload/:id', (req, res) => tusServer.handle(req, res));

export default router;
