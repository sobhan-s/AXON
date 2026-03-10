import amqp from 'amqplib';
import { logger } from './logger.config.js';
import { env_config_variable } from './env.config.js';

export const QUEUE_NAME = 'dam.asset.process';
export const EXCHANGE = 'dam.assets';

let publishChannel: amqp.Channel | null = null;
let consumeChannel: amqp.Channel | null = null;

export async function initRabbitMQ(): Promise<void> {
  const { USER, PASSWORD, HOST, PORT, VHOST } = env_config_variable.RABBITMQ;
  const url = `amqp://${USER}:${PASSWORD}@${HOST}:${PORT}/${VHOST ?? ''}`;

  const connection = await amqp.connect(url, {
    heartbeat: 60,
  });

  publishChannel = await connection.createChannel();
  consumeChannel = await connection.createChannel();

  await consumeChannel.prefetch(10);

  await publishChannel.assertQueue(QUEUE_NAME, { durable: true });
  await consumeChannel.assertQueue(QUEUE_NAME, { durable: true });

  logger.info('RabbitMQ connected');
}

export function rabbitPublish(payload: object): void {
  if (!publishChannel) throw new Error('RabbitMQ not initialized');

  publishChannel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: 'application/json',
  });

  logger.info('============== rabbitMQ job published', { payload });
}

export async function rabbitConsume(
  handler: (data: any) => Promise<void>,
): Promise<void> {
  if (!consumeChannel) throw new Error('RabbitMQ not initialized');

  const ch = consumeChannel;

  await ch.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    const retries = (msg.properties.headers?.['x-retry-count'] as number) ?? 0;

    try {
      const data = JSON.parse(msg.content.toString());
      await handler(data);
      ch.ack(msg);
    } catch (error: any) {
      logger.error('RabbitMQ handler failed', {
        error: error.message,
        retries,
      });

      if (retries < 3) {
        setTimeout(
          () => {
            publishChannel?.sendToQueue(QUEUE_NAME, msg.content, {
              persistent: true,
              headers: { 'x-retry-count': retries + 1 },
            });
          },
          2000 * (retries + 1),
        );
        ch.ack(msg);
      } else {
        logger.error('max reties reached ', { retries });
        ch.nack(msg, false, false);
      }
    }
  });

  logger.info(`cosume by rabbit mq, with queue name : --- ${QUEUE_NAME}`);
}
