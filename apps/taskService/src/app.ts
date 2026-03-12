import express, { type Express } from 'express';
import cookieparser from 'cookie-parser';
import cors from 'cors';
import { errorMiddleware } from '@dam/middlewares';
import swaggerui from 'swagger-ui-express';
import helmet from 'helmet';

// import swaggerfile from "./swagger_output.json" with { type: "json" }

const app: Express = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Upload-Length',
      'Upload-Offset',
      'Upload-Metadata',
      'Upload-Defer-Length',
      'Upload-Concat',
      'Tus-Resumable',
      'Tus-Version',
      'Tus-Max-Size',
      'Tus-Extension',
      'X-HTTP-Method-Override',
      'X-Requested-With',
    ],
    exposedHeaders: [
      'Location',
      'Upload-Offset',
      'Upload-Length',
      'Tus-Resumable',
      'Tus-Version',
      'Tus-Max-Size',
      'Tus-Extension',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

app.options(/.*/, cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '8mb' }));
app.use(cookieparser());
app.use(errorMiddleware);
app.use(helmet());
app.set('trust proxy', 1);

app.get('/hlth', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'task-service',
    currentTime: `${new Date().toISOString()}`,
  });
});

import taskRouter from './routes/task.routes.js';

app.use('/tasks', taskRouter);

export default app;
