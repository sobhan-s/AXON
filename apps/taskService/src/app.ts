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
    credentials: true,
  }),
);

app.options(/.*/, cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
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
import commentRouter from "./routes/comment.routes.js"

app.use('/tasks', taskRouter);
app.use('/comment',commentRouter)

export default app;
