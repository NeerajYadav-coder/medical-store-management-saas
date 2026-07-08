/**
 * Custom NoSQL Query Injection Sanitizer Middleware
 * 
 * Express 5 compatible: Mutates objects in place to sanitize key patterns starting with '$' or containing '.'
 * to prevent NoSQL injection attacks. This avoids direct reassignment of req.query/req.params,
 * which only have getters in Express 5.
 */

const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = sanitizeObject(obj[i]);
    }
    return obj;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        obj[key] = sanitizeObject(obj[key]);
      }
    }
  }
  return obj;
};

export const mongoSanitize = (req, res, next) => {
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }
  next();
};

export default mongoSanitize;
