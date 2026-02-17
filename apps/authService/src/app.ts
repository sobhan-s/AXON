import { PostgresClient as prisma } from '@dam/postgresql_db/postgres_db';
import express, { type Express } from 'express';
import cookieparser from 'cookie-parser';
import cors from 'cors';

const app: Express = express();

app.use(
  cors({
    origin: ['http://localhost:3000', '*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '8mb' }));
app.use(cookieparser());

export default app;
