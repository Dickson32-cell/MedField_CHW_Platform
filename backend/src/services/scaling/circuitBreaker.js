const CircuitBreaker = require('opossum');
const logger = require('../../utils/logger');

const options = {
    timeout: 5000, // If the action takes longer than 5s, tend to it as a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
    resetTimeout: 30000 // After 30s, try again.
};

const createBreaker = (action, name) => {
    const breaker = new CircuitBreaker(action, { ...options, name });

    breaker.on('open', () => logger.warn(`Circuit Breaker [${name}] is OPEN`));
    breaker.on('halfOpen', () => logger.info(`Circuit Breaker [${name}] is HALF-OPEN`));
    breaker.on('close', () => logger.info(`Circuit Breaker [${name}] is CLOSED`));

    breaker.fallback(() => ({ success: false, message: 'Service temporarily unavailable (Circuit Breaker)', isFallback: true }));

    return breaker;
};

module.exports = { createBreaker };
