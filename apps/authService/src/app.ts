import express, { type Express } from 'express';
import cookieparser from 'cookie-parser';
import cors from 'cors';
import { errorMiddleware } from '@dam/middlewares';
import swaggerui from 'swagger-ui-express';
// @ts-ignore
import swaggerfile from './swagger_output.json';

const app: Express = express();

app.use(
  cors({
    origin: ['http://localhost:5173', '*', 'http://auth-api:8001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '8mb' }));
app.use(cookieparser());
app.use(errorMiddleware);
app.set('trust proxy', 1);
app.use('/doc', swaggerui.serve, swaggerui.setup(swaggerfile));

app.get('/hlth', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'auth-service',
    currentTime: `${new Date().toISOString()}`,
  });
});

import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';

app.use('/auth', authRouter);
app.use('/user', userRouter);

export default app;
