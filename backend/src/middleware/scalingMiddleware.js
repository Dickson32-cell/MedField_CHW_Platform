const requestPrioritizer = require('../services/scaling/requestPrioritizer');
const adaptiveCache = require('../services/scaling/adaptiveCache');
const logger = require('../utils/logger');

const scalingMiddleware = (req, res, next) => {
    // 1. Check Priority
    if (!requestPrioritizer.shouldAccept(req.path)) {
        logger.warn(`Rejecting LOW priority request: ${req.path}`);
        return res.status(503).json({
            success: false,
            message: 'Server is currently under heavy load. Please try again later.',
            isOverload: true
        });
    }

    // 2. Check Cache (Simple GET caching)
    if (req.method === 'GET') {
        const cached = adaptiveCache.get(req.originalUrl);
        if (cached) {
            return res.json(cached);
        }

        // Intercept res.json to cache the response
        const originalJson = res.json;
        res.json = function (data) {
            if (res.statusCode === 200 && data.success) {
                let ttl = 60000; // 1 min default
                if (req.path.includes('/api/protocols')) ttl = 300000;
                if (req.path.includes('/api/dashboard/stats')) ttl = 30000;

                adaptiveCache.set(req.originalUrl, data, ttl);
            }
            return originalJson.call(this, data);
        };
    }

    next();
};

module.exports = scalingMiddleware;
