import { PrismaClient } from '@prisma/client';
import { type ActivityAction } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env_config_variable } from '@dam/config';
import { logger } from '@dam/config';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('../../', '.env') });

const isDev = env_config_variable.ENVIORMENT.PROD !== 'production';
const connectionSting = env_config_variable.DB.DEV.POSTGRESQL_DB;

if (!connectionSting) {
  logger.error('Connection Url is missing .....');
}

const adapter = new PrismaPg({
  connectionSting: connectionSting,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const PostgresClient = globalForPrisma.prisma ?? new PrismaClient();

if (isDev) {
  globalForPrisma.prisma = PostgresClient;
}

export { PrismaClient, PostgresClient };
export { ActivityAction };
