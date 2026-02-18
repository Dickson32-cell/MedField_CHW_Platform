const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Create Redis client if connection string exists
let redisClient;
if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    redisClient = new Redis(process.env.REDIS_URL || {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
    });

    redisClient.on('error', (err) => {
        logger.error({ err }, 'Redis rate-limiter client error');
    });
}

/**
 * Creates a rate limiter middleware
 * @param {Object} options Limiter options
 * @returns {Function} Express middleware
 */
const createLimiter = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per `window`
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        message: {
            success: false,
            message: 'Too many requests, please try again later.'
        }
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Use Redis store if available for distributed rate limiting across cluster
    if (redisClient) {
        finalOptions.store = new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
        });
        logger.info('Rate limiter initialized with Redis store');
    } else {
        logger.warn('Rate limiter initialized with memory store (NOT distributed)');
    }

    return rateLimit(finalOptions);
};

// specialized limiters
const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 login/register attempts per 15 minutes (Relaxed for testing)
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again in 15 minutes.'
    }
});

const syncLimiter = createLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 push/pull events per 5 minutes
    message: {
        success: false,
        message: 'Sync in progress or too frequent. Please wait a few minutes.'
    }
});

const apiLimiter = createLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60 // 1 request per second average
});

module.exports = {
    createLimiter,
    authLimiter,
    syncLimiter,
    apiLimiter
};
