const metricsCollector = require('../services/scaling/metricsCollector');

const requestTracker = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const isError = res.statusCode >= 500;

        // Update metrics collector (simple rolling average/logic)
        // In a real system, we'd use a more sophisticated way to compute p95
        // Here we just pass individual data points for the aggregator to process
        if (metricsCollector.recordRequest) {
            metricsCollector.recordRequest(duration, isError);
        }
    });

    next();
};

module.exports = requestTracker;
