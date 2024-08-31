const redis = require('redis');
const client = redis.createClient({
    url: 'redis://localhost:6379'
});

client.on('error', (err) => {
    console.error('Redis error:', err);
});

client.on('connect', () => {
    console.log('Connected to Redis');
});

client.on('ready', () => {
    console.log('Redis client is ready');
});

process.on('SIGINT', () => {
    client.quit((err) => {
        if (err) {
            console.error('Error while closing Redis client:', err);
        } else {
            console.log('Redis client disconnected due to application termination');
        }
        process.exit(0);
    });
});

module.exports = client;
