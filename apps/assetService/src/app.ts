import express, { type Express } from 'express';
import cookieparser from 'cookie-parser';
import cors from 'cors';
import { errorMiddleware } from '@dam/middlewares';

const app: Express = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    credentials:true
  }),
);

app.options(/.*/, cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '8mb' }));
app.use(cookieparser());
app.use(errorMiddleware);
app.set('trust proxy', 1);

app.get('/hlth', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'asset-service',
    currentTime: `${new Date().toISOString()}`,
  });
});

import assetRouter from './routes/asset.routes.js';

app.use('/api/assets', assetRouter);

export default app;
