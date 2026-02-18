require('dotenv').config();
const Redis = require('ioredis');

const redisClient = new Redis(process.env.REDIS_URL || {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
});

redisClient.flushall()
    .then(() => {
        console.log('Redis store flushed successfully.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Failed to flush Redis:', err.message);
        process.exit(1);
    });
