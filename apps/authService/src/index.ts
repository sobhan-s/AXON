import app from './app.js';
import { PostgresClient, PrismaClient } from '@dam/postgresql_db';
import { env_config_variable } from '@dam/config';
import { logger } from '@dam/config';

const prisma: PrismaClient = PostgresClient.getInstance();
const PORT = env_config_variable.PORT.AUTH;

let server: ReturnType<typeof app.listen>;
const SHUTDOWN_TIMEOUT = 10000;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.info(`⚠️ ${signal} received. Starting graceful shutdown...`);

  const forceShutdown = setTimeout(() => {
    logger.error('❌ Shutdown timeout reached. Forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    if (server) {
      server.close(() => {
        logger.info('✅ HTTP server closed');
      });
    }

    await prisma.$disconnect();
    logger.info('✅ Database disconnected');

    clearTimeout(forceShutdown);
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('❌ Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

export { prisma };

startServer();
