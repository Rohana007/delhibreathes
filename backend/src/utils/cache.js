const NodeCache = require('node-cache');
const config = require('../config');
const logger = require('./logger');

class CacheService {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: config.cache.ttl,
      checkperiod: 60,
      useClones: false,
    });

    this.cache.on('expired', (key, value) => {
      logger.debug(`Cache expired: ${key}`);
    });
  }

  get(key) {
    const value = this.cache.get(key);
    if (value) {
      logger.debug(`Cache hit: ${key}`);
    } else {
      logger.debug(`Cache miss: ${key}`);
    }
    return value;
  }

  set(key, value, ttl = config.cache.ttl) {
    this.cache.set(key, value, ttl);
    logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
  }

  del(key) {
    this.cache.del(key);
    logger.debug(`Cache deleted: ${key}`);
  }

  flush() {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  getStats() {
    return this.cache.getStats();
  }
}

module.exports = new CacheService();

