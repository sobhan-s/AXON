import Fastify, {
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from 'fastify';
import httpProxy from '@fastify/http-proxy';
import { env_config_variable } from '@dam/config';
import { logger } from '@dam/config';
import cors from '@fastify/cors';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Origin',
    'X-Requested-With',
    'Accept',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

app.addHook('onRequest', async (request, reply) => {
  const start = Date.now();

  reply.raw.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('asdfasdf', {
      method: request.method,
      url: request.url,
      status: reply.statusCode,
      duration: `${duration}ms`,
    });
  });
});

const createServiceProxy = async (routePath: string, target: string) => {
  // console.log('-----------------', routePath, target);
  await app.register(httpProxy, {
    upstream: target,
    prefix: routePath,
    rewritePrefix: '',

    http2: false,

    preHandler: (
      request: FastifyRequest,
      reply: FastifyReply,
      done: HookHandlerDoneFunction,
    ) => {
      logger.info(`Forwarding ${request.method} ${request.url} to ${target}`);
      done();
    },

    // i can omit also the done and use async

    replyOptions: {
      onError(reply, error) {
        logger.error({
          message: 'Proxy Error',
          error: error.error.message,
        });

        if (!reply.sent) {
          reply.status(502).send({
            success: false,
            message: 'Service temporarily unavailable',
          });
        }
      },
    },
  });
};

createServiceProxy(
  `/api/${env_config_variable.PREFIXES.AUTH_SERVICE.AUTH}`,
  env_config_variable.SERVICE_URI.AUTH_URI!,
);
createServiceProxy(
  `/api/${env_config_variable.PREFIXES.AUTH_SERVICE.USER}`,
  env_config_variable.SERVICE_URI.USER_URI!,
);
createServiceProxy(
  `/api/${env_config_variable.PREFIXES.PROJECT_SERVICE.ORGS}`,
  env_config_variable.SERVICE_URI.ORGANIZATION_URI!,
);
createServiceProxy(
  `/api/${env_config_variable.PREFIXES.PROJECT_SERVICE.PROJECT}`,
  env_config_variable.SERVICE_URI.PROJECT_URI!,
);
createServiceProxy(
  `/api/${env_config_variable.PREFIXES.TASK_SERVICE.TASKS}`,
  env_config_variable.SERVICE_URI.TASK_URI!,
);
createServiceProxy(
  `/api/${env_config_variable.PREFIXES.TASK_SERVICE.COMMENT}`,
  env_config_variable.SERVICE_URI.COMMENT_URI!,
);
createServiceProxy(
  `/api/${env_config_variable.PREFIXES.ASSETS_SERVICE.ASSETS}`,
  env_config_variable.SERVICE_URI.ASSET_URI!,
);
createServiceProxy(
  `/${env_config_variable.PREFIXES.ASSETS_SERVICE.ASSET_VARIANTS}`,
  env_config_variable.SERVICE_URI.ASSET_VARIANTS_URI!,
);
createServiceProxy(
  `/api/${env_config_variable.PREFIXES.ANALYTICS_SERVICE}`,
  env_config_variable.SERVICE_URI.ANALYTICS_URI!,
);

app.setErrorHandler(
  (error: Error, request: FastifyRequest, reply: FastifyReply) => {
    logger.error({
      message: 'Unhandled Gateway Error',
      error: error.message,
    });

    if (!reply.sent) {
      reply.status(500).send({
        success: false,
        message: 'Internal Gateway Error',
      });
    }
  },
);

const start = async () => {
  try {
    await app.listen({
      port: env_config_variable.PORT.MAIN_PORT,
      host: '0.0.0.0',
    });

    logger.info(
      `Gateway running on port ${env_config_variable.PORT.MAIN_PORT}`,
    );
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
