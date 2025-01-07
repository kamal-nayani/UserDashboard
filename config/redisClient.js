const redis = require('redis');

// Create a Redis client instance
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    // Add password if your Redis instance requires authentication
    // password: process.env.REDIS_PASSWORD
});

// Handle connection events
redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

// Initialize the Redis connection
(async () => {
    try {
        await redisClient.connect(); // For Redis v4 and above
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();

module.exports = redisClient;
