import { IRouter, Router } from 'express';
import { tusServer } from '../service/upload.service.js';

const router: IRouter = Router();

// Upload a new file
router.all('/upload', (req, res) => tusServer.handle(req, res));

// Upload or resume a specific file by id
router.all('/upload/:id', (req, res) => tusServer.handle(req, res));

export default router;
