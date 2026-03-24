import { initRabbitMQ, rabbitConsume, logger, QUEUES } from '@dam/config';
import { processAsset } from './asset.processor.js';
import { connectMongoDB, disconnectMongoDB } from '@dam/mongodb';
import { processReport } from './processior/report.processor.js';

async function startWorker() {
  await connectMongoDB();
  logger.info('Worker connected to MongoDB');
  await initRabbitMQ();

  await rabbitConsume(
    QUEUES.ASSET_PROCESS,
    async (job) => {
      await processAsset(job);
    },
    10,
  );

  await rabbitConsume(
    QUEUES.REPORT_GENERATE,
    async (job) => {
      await processReport(job);
    },
    2,
  );

  logger.info('Worker is running');
}

startWorker().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
