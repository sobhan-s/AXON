import express, { type Express } from 'express';
import cookieparser from 'cookie-parser';
import cors from 'cors';
import { errorMiddleware } from '@dam/middlewares';
import swaggerui from 'swagger-ui-express';
import helmet from 'helmet';
// import status from "express-status-monitor"
import organizationsAnalyticalRoutes from './routes/org.routes.js';

// import swaggerfile from "./swagger_output.json" with { type: "json" }

const app: Express = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    credentials: true,
  }),
);
// app.use(status())

app.options(/.*/, cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '8mb' }));
app.use(cookieparser());
app.use(errorMiddleware);
app.set('trust proxy', 1);
app.use(helmet());

app.get('/hlth', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'upload-service',
    currentTime: `${new Date().toISOString()}`,
  });
});

app.use('/analytics',organizationsAnalyticalRoutes)


export default app;
