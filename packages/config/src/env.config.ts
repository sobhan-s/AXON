import dotenv from 'dotenv';
import path from 'path';

// dotenv.config({ path: path.resolve('../../', '.env') });
dotenv.config({ path: path.resolve('../../', '.env.local') });

console.log('-------', process.env.AUTH_SERVICE_URI);

export const env_config_variable = {
  SERVICE_URI: {
    AUTH_SERVICE: process.env.AUTH_SERVICE_URI,
    AUTH: process.env.AUTH_URI,
    USER: process.env.USER_URI,
    PROJECT_SERVICE_URI: process.env.PROJECT_SERVICE_URI,
    ORGANIZATION: process.env.ORGANIZATION_URI,
    PROJECT: process.env.PROJECT_URI,
    TASK_SERVICE_URI: process.env.TASK_SERVICE_URI,
    TASK: process.env.TASK_URI,

    GATEWAY_SERVICE: process.env.GATEWAY_SERVICE_URI,
  },
  PORT: {
    MAIN_PORT: parseInt(process.env.MAIN_PORT || '8000', 10),
    AUTH: parseInt(process.env.AUTH_PORT || '8001', 10),
    PROJECT_PORT: parseInt(process.env.PROJECT_PORT || '8002', 10),
    TASKSERVICE_PORT: parseInt(process.env.TASK_PORT || '8003', 10),
    UPLOAD_PORT: parseInt(process.env.UPLOAD_PORT || '8004', 10),
    ASSET_PORT: parseInt(process.env.ASSET_PORT || '8005', 10),
    WORKER_PORT: parseInt(process.env.WORKER_PORT || '8006', 10),
  },
  DB: {
    DEV: {
      POSTGRESQL_DB: process.env.DATABASE_URL as string,
      MONGO_DB: process.env.DATABASE_MONGO_URL as string,
    },
    PROD: {
      POSTGRESQL_DB: process.env.DATABASE_URL as string,
      MONGO_DB: process.env.DATABASE_MONGO_URL as string,
    },
  },
  DB_NAME: {
    DEV: {
      POSTGRESQL_DB_NAME: process.env.POSTGRES_DB as string,
      MONGO_DB_NAME: process.env.MONGO_DB as string,
    },
    PROD: {
      POSTGRESQL_DB_NAME: process.env.POSTGRES_DB as string,
      MONGO_DB_NAME: process.env.MONGO_DB as string,
    },
  },
  ENVIORMENT: {
    DEV: process.env.DEV_ENV,
    PROD: process.env.PROD_ENV,
  },
  MAIL: {
    HOST: process.env.MAIL_HOST,
    PORT: process.env.MAIL_PORT,
    SECURE: process.env.MAIL_SECURE,
    USER: process.env.MAIL_USER,
    FROM: process.env.MAIL_FROM,
    PASSWORD: process.env.MAIL_PASS,
  },
  TOKEN: {
    ACCESS_TOKEN: process.env.ACCESS_TOKEN,
    REFRESH_TOKEN: process.env.REFRESH_TOKEN,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,
  },
  MINIO: {
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT!,
    MINIO_PORT: Number(process.env.MINIO_PORT ?? 9000),
    MINIO_USESSL: process.env.MINIO_USE_SSL === 'true',
    MINIO_ROOTUSER: process.env.MINIO_ROOT_USER!,
    MINIO_PASSWORD: process.env.MINIO_ROOT_PASSWORD!,
    MINIO_BUCKET_NAME: process.env.MINIO_BUCKET!,
    MINIO_PUBLI_URL: process.env.MINIO_PUBLIC_URL,
  },
  RABBITMQ: {
    HOST: process.env.RABBITMQ_HOST || 'localhost',
    PORT: parseInt(process.env.RABBITMQ_PORT || '5672', 10),
    USER: process.env.RABBITMQ_DEFAULT_USER || 'damrabbitmq',
    PASSWORD: process.env.RABBITMQ_DEFAULT_PASS,
    VHOST: process.env.RABBITMQ_VHOST || 'dam',
  },
  TEMP_DIR: {
    PATH: process.env.TUS_TMP_DIR_PATH,
  },
};
