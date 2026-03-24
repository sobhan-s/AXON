import amqp from 'amqplib';
import { logger } from './logger.config.js';
import { env_config_variable } from './env.config.js';

export const QUEUES = {
  ASSET_PROCESS: 'dam.asset.process',
  REPORT_GENERATE: 'dam.report.generate',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

let connection: amqp.ChannelModel | null = null;
let publishChannel: amqp.Channel | null = null;

export async function initRabbitMQ(): Promise<void> {
  const { USER, PASSWORD, HOST, PORT, VHOST } = env_config_variable.RABBITMQ;
  const url = `amqp://${USER}:${PASSWORD}@${HOST}:${PORT}/${VHOST ?? ''}`;

  connection = await amqp.connect(url, { heartbeat: 60 });
  publishChannel = await connection.createChannel();

  for (const queue of Object.values(QUEUES)) {
    await publishChannel.assertQueue(queue, { durable: true });
  }

  connection.on('close', () => {
    logger.warn('RabbitMQ connection closed — reconnecting in 5s');
    setTimeout(initRabbitMQ, 5000);
  });

  connection.on('error', (err) => {
    logger.error('RabbitMQ connection error', { error: err.message });
  });

  logger.info('RabbitMQ connected', { queues: Object.values(QUEUES) });
}

export function rabbitPublish(queue: QueueName, payload: object): void {
  if (!publishChannel) throw new Error('RabbitMQ not initialized');

  publishChannel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: 'application/json',
  });

  logger.info('RabbitMQ job published', { queue, payload });
}

export async function rabbitConsume(
  queue: QueueName,
  handler: (data: any) => Promise<void>,
  prefetch = 10,
): Promise<void> {
  if (!connection) throw new Error('RabbitMQ not initialized');

  const consumeChannel = await connection.createChannel();
  await consumeChannel.prefetch(prefetch);
  await consumeChannel.assertQueue(queue, { durable: true });

  await consumeChannel.consume(queue, async (msg) => {
    if (!msg) return;

    const retries = (msg.properties.headers?.['x-retry-count'] as number) ?? 0;

    try {
      const data = JSON.parse(msg.content.toString());
      await handler(data);
      consumeChannel.ack(msg);
    } catch (error: any) {
      logger.error('RabbitMQ handler failed', {
        queue,
        error: error.message,
        retries,
      });

      if (retries < 3) {
        setTimeout(
          () => {
            publishChannel?.sendToQueue(queue, msg.content, {
              persistent: true,
              headers: { 'x-retry-count': retries + 1 },
            });
          },
          2000 * (retries + 1),
        );

        consumeChannel.ack(msg);
      } else {
        logger.error('Max retries reached  discarding message', {
          queue,
          retries,
        });
        consumeChannel.nack(msg, false, false);
      }
    }
  });

  logger.info(`RabbitMQ consumer started`, { queue, prefetch });
}
