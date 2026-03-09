import app from './app.js';
import { PostgresClient as prisma, PrismaClient } from '@dam/postgresql_db';
import { env_config_variable, initRabbitMQ } from '@dam/config';
import { logger } from '@dam/config';
import { connectMongoDB, disconnectMongoDB } from '@dam/mongodb';
import { initMinio } from '@dam/config';

const PORT = env_config_variable.PORT.ASSET_PORT;

let server: ReturnType<typeof app.listen>;
const SHUTDOWN_TIMEOUT = 10000;

const startServer = async () => {
  try {
    // logger.info("------====------",prisma)
    // console.log(prisma.$queryRaw`SELECT now()`);
    await prisma.$connect();
    logger.info('Postgres Database connected successfully'); 

    await connectMongoDB();
    logger.info('Mongodb Database connected successfully');

    await initMinio();

    await initRabbitMQ();

    server = app.listen(PORT, () => {
      logger.info(` Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(' Failed to start server', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string) => {
  logger.info(` ${signal} received. Starting graceful shutdown...`);

  const forceShutdown = setTimeout(() => {
    logger.error('Shutdown timeout reached. Forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    if (server) {
      server.close(() => {
        logger.info(' HTTP server closed');
      });
    }

    await prisma.$disconnect();
    logger.info(' Postres Database disconnected');

    await disconnectMongoDB();
    logger.info(' MongoDb Database disconnected');

    clearTimeout(forceShutdown);
    process.exit(0);
  } catch (error) {
    logger.error(' Error during graceful shutdown', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { prisma };

startServer();
