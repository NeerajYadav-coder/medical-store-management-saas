// /**
//  * config/env.js
//  *
//  * Responsibility:
//  * - Load environment variables
//  * - Validate required variables at startup
//  * - Export a clean, controlled config object
//  *
//  * If something critical is missing → crash immediately
//  * (Fail fast > silent production bugs)
//  */

// const dotenv = require('dotenv');

// // Load .env into process.env
// dotenv.config();

// /**
//  * Helper to fetch env variable safely
//  */
// function getEnv(key, required = true) {
//   const value = process.env[key];

//   if (required && (value === undefined || value === '')) {
//     console.error(` Missing required environment variable: ${key}`);
//     process.exit(1); // Hard crash — unsafe to continue
//   }

//   return value;
// }

// /**
//  * Centralized environment config
//  * Do NOT access process.env directly anywhere else
//  */
// const env = {
//   NODE_ENV: getEnv('NODE_ENV', false) || 'development',

//   PORT: Number(getEnv('PORT', false)) || 5000,

//   MONGO_URI: getEnv('MONGO_URI'),

//   JWT_ACCESS_SECRET: getEnv('JWT_ACCESS_SECRET'),

//   JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET', false), // future use

//   JWT_ACCESS_EXPIRES_IN: getEnv('JWT_ACCESS_EXPIRES_IN', false) || '1d',

//   CORS_ORIGIN: getEnv('CORS_ORIGIN', false) || '*',
// };

// /**
//  * Optional: log safe startup info (never secrets)
//  */
// if (env.NODE_ENV !== 'production') {
//   console.log('Environment loaded:', {
//     NODE_ENV: env.NODE_ENV,
//     PORT: env.PORT,
//   });
// }

// module.exports = env;








/**
 * config/env.js
 *
 * Responsibility:
 * - Load environment variables
 * - Validate required variables at startup
 * - Export a clean, controlled config object
 *
 * If something critical is missing → crash immediately
 * (Fail fast > silent production bugs)
 */

import dotenv from 'dotenv';

// Load .env into process.env
dotenv.config();

/**
 * Helper to fetch env variable safely
 */
function getEnv(key, required = true) {
  const value = process.env[key];

  if (required && (value === undefined || value === '')) {
    console.error(` Missing required environment variable: ${key}`);
    process.exit(1); // Hard crash — unsafe to continue
  }

  return value;
}

/**
 * Centralized environment config
 * Do NOT access process.env directly anywhere else
 */
const env = {
  NODE_ENV: getEnv('NODE_ENV', false) || 'development',

  PORT: Number(getEnv('PORT', false)) || 5000,

  MONGO_URI: getEnv('MONGO_URI'),

  JWT_ACCESS_SECRET: getEnv('JWT_ACCESS_SECRET'),

  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET', false), // future use

  JWT_ACCESS_EXPIRES_IN: getEnv('JWT_ACCESS_EXPIRES_IN', false) || '1d',

  CORS_ORIGIN: getEnv('CORS_ORIGIN', false) || 'http://localhost:3000',
};

/**
 * Optional: log safe startup info (never secrets)
 */
if (env.NODE_ENV !== 'production') {
  console.log('Environment loaded:', {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
  });
}

export default env;
