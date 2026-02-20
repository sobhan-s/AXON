import app from './app.js';
import { PostgresClient as prisma } from '@dam/postgresql_db';
import { PrismaClient } from '@prisma/client';
import { env_config_variable } from '@dam/config';
import { logger } from '@dam/config';

const PORT = env_config_variable.PORT.AUTH;

let server: ReturnType<typeof app.listen>;
const SHUTDOWN_TIMEOUT = 10000;

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

// const prisma = globalForPrisma.prisma ?? new PrismaClient();

const startServer = async () => {
  try {
    // logger.info("------====------",prisma)
    // console.log(prisma.$queryRaw`SELECT now()`);
    await prisma.$connect();
    logger.info('Database connected successfully');

    server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(' Failed to start server', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  const forceShutdown = setTimeout(() => {
    logger.error('Shutdown timeout reached. Forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    await prisma.$disconnect();
    logger.info('Database disconnected');

    clearTimeout(forceShutdown);
    process.exit(0);
  } catch (error) {
    logger.error(' Error during graceful shutdown', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

export { prisma };

startServer();
