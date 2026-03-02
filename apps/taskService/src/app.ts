import express, { type Express } from 'express';
import cookieparser from 'cookie-parser';
import cors from 'cors';
import { errorMiddleware } from '@dam/middlewares';
import swaggerui from 'swagger-ui-express';
// import swaggerfile from "./swagger_output.json" with { type: "json" }

const app: Express = express();

app.use(
  cors({
    origin: ['http://localhost:5173', '*'],
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

app.get('/hlth', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'task-service',
    currentTime: `${new Date().toISOString()}`,
  });
});

import taskRouter from "./routes/task.routes.js"

app.use("/tasks",taskRouter)


export default app;
