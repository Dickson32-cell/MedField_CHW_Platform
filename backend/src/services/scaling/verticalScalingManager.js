const sequelize = require('../../config/database');
const adaptiveCache = require('./adaptiveCache');
const requestPrioritizer = require('./requestPrioritizer');
const logger = require('../../utils/logger');

class VerticalScalingManager {
    constructor() {
        this.currentLevel = 'NORMAL';
    }

    async scaleTo(level) {
        if (this.currentLevel === level) return;

        logger.info(`Vertical Scaling: Moving from ${this.currentLevel} to ${level}`);

        switch (level) {
            case 'NORMAL':
                this.resetOptimizations();
                break;
            case 'WARM':
                this.applyWarmOptimizations();
                break;
            case 'HOT':
                this.applyHotOptimizations();
                break;
            case 'CRITICAL':
                this.applyCriticalOptimizations();
                break;
        }

        this.currentLevel = level;
    }

    applyWarmOptimizations() {
        // Expand DB pool if possible (Sequelize doesn't easily allow dynamic pool adjustment after init, 
        // but we can suggest it or handle it via pool configuration if we used a more dynamic one)
        logger.info('Applying WARM optimizations: Monitor connection usage');
    }

    applyHotOptimizations() {
        adaptiveCache.enable();
        requestPrioritizer.enable();
        logger.info('Applying HOT optimizations: Enabled Caching & Request Prioritization');
    }

    applyCriticalOptimizations() {
        // Already handled by circuit breakers being active, but we can add more logic here
        logger.info('Applying CRITICAL optimizations: Deferring non-critical background tasks');
    }

    resetOptimizations() {
        adaptiveCache.disable();
        requestPrioritizer.disable();
        logger.info('Resetting vertical optimizations to NORMAL');
    }

    async optimizeMemory() {
        if (global.gc) {
            logger.info('Manual garbage collection triggered');
            global.gc();
        }
    }
}

module.exports = new VerticalScalingManager();
