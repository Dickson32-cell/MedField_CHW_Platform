const metricsCollector = require('./scaling/metricsCollector');
const verticalScalingManager = require('./scaling/verticalScalingManager');
const horizontalScalingManager = require('./scaling/horizontalScalingManager');
const logger = require('../utils/logger');

class SystemHealthMonitor {
    constructor() {
        this.thresholds = {
            vertical: {
                warm: { cpu: 60, memory: 65, latencyP95: 2000, duration: 120000 },
                hot: { cpu: 75, memory: 75, latencyP95: 3000, duration: 180000 },
                critical: { cpu: 85, memory: 85, latencyP95: 4000, duration: 120000 }
            },
            horizontalTrigger: {
                cpu: 90,
                memory: 90,
                queueDepth: 500,
                latencyP95: 5000,
                errorRate: 10,
                duration: 300000
            },
            scaleDown: {
                cpu: 40,
                cooldownPeriod: 600000
            }
        };

        this.currentPhase = 'NORMAL';
        this.lastScalingTime = Date.now();
    }

    async start() {
        logger.info('System Health Monitor STARTED');
        setInterval(() => this.evaluate(), parseInt(process.env.SCALING_EVALUATION_INTERVAL) || 30000);
    }

    async evaluate() {
        const metrics = await metricsCollector.collect();
        if (!metrics) return;

        const decision = this.evaluateScalingDecision(metrics);
        if (decision !== this.currentPhase) {
            await this.executeScalingAction(decision);
        }
    }

    evaluateScalingDecision(metrics) {
        if (metrics.cpu > this.thresholds.horizontalTrigger.cpu || metrics.latencyP95 > this.thresholds.horizontalTrigger.latencyP95) {
            return 'HORIZONTAL';
        }
        if (metrics.cpu > this.thresholds.vertical.critical.cpu) {
            return 'VERTICAL_CRITICAL';
        }
        if (metrics.cpu > this.thresholds.vertical.hot.cpu) {
            return 'VERTICAL_HOT';
        }
        if (metrics.cpu > this.thresholds.vertical.warm.cpu) {
            return 'VERTICAL_WARM';
        }
        if (metrics.cpu < this.thresholds.scaleDown.cpu && (Date.now() - this.lastScalingTime > this.thresholds.scaleDown.cooldownPeriod)) {
            return 'NORMAL';
        }
        return this.currentPhase;
    }

    async executeScalingAction(newPhase) {
        logger.info(`Changing scaling phase from ${this.currentPhase} to ${newPhase}`);

        if (newPhase.startsWith('VERTICAL')) {
            await verticalScalingManager.scaleTo(newPhase.replace('VERTICAL_', ''));
        } else if (newPhase === 'HORIZONTAL') {
            await horizontalScalingManager.scaleUp();
        } else if (newPhase === 'NORMAL') {
            if (horizontalScalingManager.getWorkerCount() > 1) {
                await horizontalScalingManager.scaleDown();
            } else {
                await verticalScalingManager.scaleTo('NORMAL');
            }
        }

        this.currentPhase = newPhase;
        this.lastScalingTime = Date.now();
    }

    getStatus() {
        return {
            currentPhase: this.currentPhase,
            workerCount: horizontalScalingManager.getWorkerCount(),
            lastScalingTime: new Date(this.lastScalingTime).toISOString()
        };
    }
}

module.exports = new SystemHealthMonitor();
