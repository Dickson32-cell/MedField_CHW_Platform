const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis = null;

/**
 * Initialize Redis connection
 * Falls back gracefully if Redis is not available
 */
const initRedis = () => {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 5000
    });

    redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redis.on('error', (err) => {
      logger.warn({ err }, 'Redis connection error - running without Redis');
    });

    return redis;
  } catch (error) {
    logger.warn({ err: error }, 'Failed to initialize Redis');
    return null;
  }
};

/**
 * Get Redis client (lazy connect)
 */
const getRedis = async () => {
  if (!redis) {
    initRedis();
  }
  
  if (redis && redis.status === 'wait') {
    await redis.connect();
  }
  
  return redis;
};

/**
 * Store token in blacklist
 */
const addToBlacklist = async (token, userId, expirySeconds = 86400 * 7) => {
  try {
    const redisClient = await getRedis();
    if (!redisClient) return false;
    
    const key = `token_blacklist:${userId}:${token.substring(0, 32)}`;
    await redisClient.setex(key, expirySeconds, '1');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Failed to add token to blacklist');
    return false;
  }
};

/**
 * Check if token is blacklisted
 */
const isBlacklisted = async (token, userId) => {
  try {
    const redisClient = await getRedis();
    if (!redisClient) return false;
    
    const key = `token_blacklist:${userId}:${token.substring(0, 32)}`;
    const result = await redisClient.get(key);
    return result === '1';
  } catch (error) {
    logger.error({ err: error }, 'Failed to check token blacklist');
    return false;
  }
};

/**
 * Invalidate all tokens for a user (logout all sessions)
 */
const invalidateUserTokens = async (userId) => {
  try {
    const redisClient = await getRedis();
    if (!redisClient) return false;
    
    const pattern = `token_blacklist:${userId}:*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Failed to invalidate user tokens');
    return false;
  }
};

module.exports = {
  initRedis,
  getRedis,
  addToBlacklist,
  isBlacklisted,
  invalidateUserTokens
};