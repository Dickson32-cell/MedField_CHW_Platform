const logger = require('../../utils/logger');

class RequestPrioritizer {
    constructor() {
        this.queue = [];
        this.maxQueueDepth = 500;
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
        logger.info('Request Prioritization ENABLED');
    }

    disable() {
        this.enabled = false;
        this.queue = [];
        logger.info('Request Prioritization DISABLED');
    }

    getPriority(path) {
        if (path.includes('/api/protocols') || path.includes('/api/referrals')) {
            return 'CRITICAL';
        }
        if (path.includes('/api/patients') || path.includes('/api/visits')) {
            return 'HIGH';
        }
        if (path.includes('/api/dashboard/stats')) {
            return 'NORMAL';
        }
        return 'LOW';
    }

    shouldAccept(path) {
        if (!this.enabled) return true;

        const priority = this.getPriority(path);
        if (priority === 'CRITICAL' || priority === 'HIGH') return true;

        if (this.queue.length >= this.maxQueueDepth) {
            if (priority === 'LOW' || priority === 'NORMAL') {
                return false;
            }
        }

        return true;
    }

    getQueueDepth() {
        return this.queue.length;
    }
}

module.exports = new RequestPrioritizer();
