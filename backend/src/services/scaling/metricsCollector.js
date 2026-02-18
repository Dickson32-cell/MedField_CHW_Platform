const pidusage = require('pidusage');
const os = require('os');
const logger = require('../../utils/logger');
const requestPrioritizer = require('./requestPrioritizer');

class MetricsCollector {
    constructor() {
        this.history = [];
        this.maxHistory = 100;
    }

    async collect() {
        try {
            const stats = await pidusage(process.pid);
            const metrics = {
                timestamp: new Date().toISOString(),
                cpu: stats.cpu,
                memory: (stats.memory / os.totalmem()) * 100,
                memoryBytes: stats.memory,
                loadAvg: os.loadavg(),
                queueDepth: requestPrioritizer.getQueueDepth(),
                // These will be updated by middleware tracking
                latencyP95: this.latestLatencyP95 || 0,
                errorRate: this.latestErrorRate || 0
            };

            this.history.push(metrics);
            if (this.history.length > this.maxHistory) {
                this.history.shift();
            }

            return metrics;
        } catch (error) {
            logger.error({ error }, 'Metrics collection failed');
            return null;
        }
    }

    updateTrackedMetrics(latency, errorRate) {
        this.latestLatencyP95 = latency;
        this.latestErrorRate = errorRate;
    }

    getMetricsHistory() {
        return this.history;
    }
}

module.exports = new MetricsCollector();
