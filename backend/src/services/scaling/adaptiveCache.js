const { LRUCache } = require('lru-cache');
const logger = require('../../utils/logger');

class AdaptiveCache {
    constructor() {
        this.cache = new LRUCache({
            max: 500,
            ttl: 1000 * 60 * 5, // 5 minutes default
        });
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
        logger.info('Adaptive Caching ENABLED');
    }

    disable() {
        this.enabled = false;
        this.cache.clear();
        logger.info('Adaptive Caching DISABLED');
    }

    get(key) {
        if (!this.enabled) return null;
        return this.cache.get(key);
    }

    set(key, value, ttl) {
        if (!this.enabled) return;
        this.cache.set(key, value, { ttl });
    }

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }
}

module.exports = new AdaptiveCache();
