import { Redis } from 'ioredis';
import { logger } from './logger.config.js';
import { env_config_variable } from './env.config.js';

let client: Redis | null = null;

export const getRedisClient = async () => {
  if (!client) {
    client = new Redis({
      host: env_config_variable.REDIS.REDIS_HOST || 'localhost',
      port: env_config_variable.REDIS.REDIS_PORT,
    });

    client.on('error', (err) =>
      logger.error('Redis error', { error: err.message }),
    );

    client.on('connect', () => logger.info('Redis connected'));
  }
  return client;
};

export const CACHE_TTL = {
  PLATFORM: 300,
  ORG: 180,
  PROJECT: 120,
  REPORT: 600,
} as const;

export function cacheKey(...parts: (string | number)[]): string {
  return `analytics:${parts.join(':')}`;
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (!client) {
      throw new Error('Redis lcient is not found');
    }
    const val = await client.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

export async function setCache(
  key: string,
  data: unknown,
  ttl: number,
): Promise<void> {
  try {
    if (!client) {
      throw new Error('Redis client is not found');
    }
    await client.setex(key, ttl, JSON.stringify(data));
  } catch (err: any) {
    logger.warn('Redis setCache failed', { error: err.message });
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    if (!client) {
      throw new Error('Redis lcient is not found');
    }
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(keys);
  } catch (err: any) {
    logger.warn('Redis invalidateCache failed', { error: err.message });
  }
}
