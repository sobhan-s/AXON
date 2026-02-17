import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('../../', '.env') });
// console.log("-------",process.env.AUTH_SERVICE_URI);

export const env_config_variable = {
  SERVICE_URI: {
    AUTH: process.env.AUTH_SERVICE_URI,
  },
  PORT: {
    MAIN_PORT: parseInt(process.env.MAIN_PORT || '8000', 10),
    AUTH: parseInt(process.env.AUTH_PORT || '8001', 10),
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
};
