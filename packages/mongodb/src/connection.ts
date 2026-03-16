import mongoose from 'mongoose';
import { env_config_variable } from '@dam/config';
import { logger } from '@dam/config';

let isConnected = false;

export async function connectMongoDB() {
  if (isConnected) {
    logger.info('✅ MongoDB already connected');
    return;
  }

  try {
    const db = await mongoose.connect(env_config_variable.DB.DEV.MONGO_DB, {
      dbName: env_config_variable.DB_NAME.DEV.MONGO_DB_NAME,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    if (!db?.connections?.[0]) {
      return;
    }

    isConnected = db.connections[0].readyState === 1;
    logger.info('✅ MongoDB connected');

    return db;
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectMongoDB() {
  if (!isConnected) return;

  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected');
}

// Handle connection events
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected');
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  logger.info('MongoDB disconnected');
  isConnected = false;
});

process.on('SIGINT', async () => {
  await disconnectMongoDB();
  process.exit(0);
});
