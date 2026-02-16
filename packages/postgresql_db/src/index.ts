import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env_config_variable } from '@dam/config/env_variables';
import { logger } from '@dam/config/logs';

const isDev = env_config_variable.ENVIORMENT.PROD !== 'production';
const connectionSting = env_config_variable.DB.DEV.POSTGRESQL_DB;

const adapter = new PrismaPg({
  connectionSting,
});

class PostgresClient {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PostgresClient.instance) {
      if (isDev) logger.info('Creating Prisma Client instance...');

      PostgresClient.instance = new PrismaClient({ adapter });

      PostgresClient.instance
        .$connect()
        .then(() => {
          if (isDev) logger.info('Connected to PostgreSQL via Prisma');
        })
        .catch((err) => {
          logger.error('Prisma connection error', err);
        });
    }

    return PostgresClient.instance;
  }
}

export default PostgresClient;
