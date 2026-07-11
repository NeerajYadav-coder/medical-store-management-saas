import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

let redis = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('[Redis] Connection retries exhausted. Disabling cache.');
        return null; // Stop retrying
      }
      return Math.min(times * 50, 2000);
    }
  });
  
  redis.on('error', (err) => {
    console.warn('[Redis] Error:', err.message);
  });
} else {
  console.warn('[Redis] No REDIS_URL provided. Caching disabled.');
}

export default redis;
