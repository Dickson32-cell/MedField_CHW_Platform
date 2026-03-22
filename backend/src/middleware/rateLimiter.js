const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Create Redis client - REQUIRED for production
let redisClient = null;
let redisAvailable = false;

if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    try {
        redisClient = new Redis(process.env.REDIS_URL || {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            lazyConnect: false
        });

        redisClient.on('error', (err) => {
            logger.error({ err }, 'Redis rate-limiter client error');
            redisAvailable = false;
        });

        redisClient.on('connect', () => {
            redisAvailable = true;
            logger.info('Redis rate-limiter client connected');
        });

    } catch (err) {
        logger.error({ err }, 'Failed to initialize Redis client');
        redisAvailable = false;
    }
} else {
    logger.warn('REDIS_URL or REDIS_HOST not configured');
    redisAvailable = false;
}

/**
 * Check if running in production environment
 */
const isProduction = () => {
    return process.env.NODE_ENV === 'production';
};

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

    // SECURITY: Redis is REQUIRED in production - no memory store fallback
    if (isProduction()) {
        if (!redisClient) {
            logger.error('CRITICAL: Redis unavailable in production environment. Rate limiting requires Redis for distributed operation. Please configure REDIS_URL or REDIS_HOST.');
            throw new Error('Redis is required for rate limiting in production. Set REDIS_URL or REDIS_HOST environment variable.');
        }
        
        // Wait for Redis connection if not yet connected
        if (!redisAvailable && redisClient.status === 'connecting') {
            logger.info('Waiting for Redis connection...');
        }
        
        finalOptions.store = new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
        });
        logger.info('Rate limiter initialized with Redis store (production)');
    } else {
        // Development: allow memory store with warning
        if (redisClient && redisAvailable) {
            finalOptions.store = new RedisStore({
                sendCommand: (...args) => redisClient.call(...args),
            });
            logger.info('Rate limiter initialized with Redis store (development)');
        } else {
            logger.warn('Rate limiter using memory store (development only - NOT distributed). Configure Redis for production.');
        }
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

// Stricter limiter for registration to prevent spam/abuse
const registerLimiter = createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations per hour per IP
    message: {
        success: false,
        message: 'Too many accounts created. Please try again in 1 hour.'
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
    registerLimiter,
    syncLimiter,
    apiLimiter
};
