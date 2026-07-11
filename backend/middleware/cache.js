import redis from '../config/redis.js';

export const cache = (ttlSeconds = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET' || !redis) {
      return next();
    }

    const key = `cache:${req.user?.medicalStoreId || 'global'}:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redis.get(key);
      
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Intercept res.json to store in cache before sending
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300 && body.success) {
          redis.setex(key, ttlSeconds, JSON.stringify(body)).catch(err => {
            console.error('[Redis] Cache write error:', err.message);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error('[Redis] Cache read error:', err.message);
      next(); // Fallback to DB if Redis fails
    }
  };
};

export const clearCachePrefix = async (storeId, prefix) => {
  if (!redis) return;
  try {
    const keys = await redis.keys(`cache:${storeId}:${prefix}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('[Redis] Cache clear error:', err.message);
  }
};
