const cluster = require('cluster');
const os = require('os');
const logger = require('../../utils/logger');

class HorizontalScalingManager {
    constructor() {
        this.maxWorkers = parseInt(process.env.SCALING_MAX_WORKERS) || 4;
        this.workers = new Map();
    }

    async scaleUp() {
        const currentWorkers = Object.keys(cluster.workers).length;
        if (currentWorkers < this.maxWorkers) {
            logger.info(`Horizontal Scaling: Spawning new worker. Current: ${currentWorkers}`);
            const worker = cluster.fork();
            this.workers.set(worker.id, { startTime: Date.now(), status: 'starting' });
            return true;
        }
        logger.warn('Horizontal Scaling: Max workers reached');
        return false;
    }

    async scaleDown() {
        const currentWorkers = Object.keys(cluster.workers).length;
        if (currentWorkers > 1) {
            const workerIds = Object.keys(cluster.workers);
            const workerIdToKill = workerIds[workerIds.length - 1];
            const worker = cluster.workers[workerIdToKill];

            logger.info(`Horizontal Scaling: Draining worker ${workerIdToKill}`);
            worker.send({ type: 'drain' });

            // Give it 30s to drain
            setTimeout(() => {
                if (cluster.workers[workerIdToKill]) {
                    logger.info(`Horizontal Scaling: Killing worker ${workerIdToKill} after drain timeout`);
                    cluster.workers[workerIdToKill].kill();
                }
            }, 30000);

            return true;
        }
        return false;
    }

    getWorkerCount() {
        return Object.keys(cluster.workers).length;
    }

    isScalingPossible() {
        return Object.keys(cluster.workers).length < this.maxWorkers;
    }
}

module.exports = new HorizontalScalingManager();
