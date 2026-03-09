import { initRabbitMQ, rabbitConsume, logger } from '@dam/config';
import { processAsset } from './asset.processor.js';
import { connectMongoDB, disconnectMongoDB } from '@dam/mongodb';

async function startWorker() {
  await connectMongoDB();
  logger.info('Worker connected to MongoDB');

  await initRabbitMQ();

  await rabbitConsume(async (job) => {
    await processAsset(job);
  });

  logger.info('Worker is running');
}

startWorker().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
