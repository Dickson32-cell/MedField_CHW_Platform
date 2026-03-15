const express = require('express');
const router = express.Router();

let sequelize, redis;
try {
  sequelize = require('../models').sequelize;
  redis = require('../config/redis');
} catch (e) {
  // Models not loaded yet
}

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '2.0.0',
    services: {}
  };

  // Check database
  try {
    if (sequelize) {
      await sequelize.authenticate();
      health.services.database = { status: 'healthy' };
    }
  } catch (error) {
    health.services.database = { status: 'unhealthy', error: error.message };
    health.status = 'degraded';
  }

  // Check Redis
  try {
    if (redis && redis.isReady) {
      await redis.ping();
      health.services.redis = { status: 'healthy' };
    } else {
      health.services.redis = { status: 'unavailable', note: 'Redis not connected' };
    }
  } catch (error) {
    health.services.redis = { status: 'unavailable', note: 'Redis not configured' };
  }

  // Check memory
  const memoryUsage = process.memoryUsage();
  health.services.memory = {
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

//**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Readiness probe - checks if service can accept traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Ready to accept traffic
 *       503:
 *         description: Not ready
 */
router.get('/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Liveness probe - checks if service is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is running
 */
router.get('/live', (req, res) => {
  res.status(200).json({ alive: true });
});

module.exports = router;