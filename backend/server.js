// /**
//  * server.js
//  *
//  * Application entry point
//  * - Bootstraps the app
//  * - Wires middleware
//  * - Connects DB
//  * - Mounts routes
//  * - Starts HTTP server
//  */

// const express = require('express');
// const cors = require('cors');

// const env = require('./config/env');
// const connectDB = require('./config/db');

// const errorHandler = require('./middleware/error.middleware');

// // Initialize express app
// const app = express();

// /**
//  * -----------------------
//  * Global Middleware
//  * -----------------------
//  */

// // Parse JSON bodies
// app.use(express.json());

// // Enable CORS
// app.use(
//   cors({
//     origin: env.CORS_ORIGIN,
//     credentials: true,
//   })
// );

// /**
//  * -----------------------
//  * Health Check
//  * -----------------------
//  * Used by hosting platforms & monitoring
//  */
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     status: 'OK',
//     uptime: process.uptime(),
//     timestamp: new Date().toISOString(),
//   });
// });

// /**
//  * -----------------------
//  * Routes
//  * -----------------------
//  * (Mounted, not implemented here)
//  */
// app.use('/api/v1/auth', require('./routes/auth.routes'));
// app.use('/api/v1/store', require('./routes/store.routes'));
// app.use('/api/v1/medicine', require('./routes/medicine.routes'));
// app.use('/api/v1/batch', require('./routes/batch.routes'));
// app.use('/api/v1/purchase', require('./routes/purchase.routes'));
// app.use('/api/v1/sale', require('./routes/sale.routes'));
// app.use('/api/v1/customer', require('./routes/customer.routes'));
// app.use('/api/v1/supplier', require('./routes/supplier.routes'));
// app.use('/api/v1/discount', require('./routes/discount.routes'));
// app.use('/api/v1/dashboard', require('./routes/dashboard.routes'));

// /**
//  * -----------------------
//  * Error Handler (LAST)
//  * -----------------------
//  */
// app.use(errorHandler);

// /**
//  * -----------------------
//  * Server Boot
//  * -----------------------
//  */
// const startServer = async () => {
//   await connectDB();

//   app.listen(env.PORT, () => {
//     console.log(`Server running on port ${env.PORT}`);
//   });
// };

// startServer();



/**
 * server.js
 *
 * Application entry point
 * - Bootstraps the app
 * - Wires middleware
 * - Connects DB
 * - Mounts routes
 * - Starts HTTP server
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from './middleware/mongoSanitize.middleware.js';
import sanitizeBody from './middleware/sanitize.middleware.js';

import env from './config/env.js';
import connectDB from './config/db.js';

import errorHandler from './middleware/error.middleware.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();

/**
 * -----------------------
 * Global Security & Utility Middleware
 * -----------------------
 */

// Set security HTTP headers
app.use(helmet());

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Parse cookies
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize);

// Global request body sanitizer (Mass Assignment protection)
app.use(sanitizeBody);

// Enable CORS
const allowedOrigins = env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map(o => o.trim()) : ['http://localhost:3000'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
      }
    },
    credentials: true,
  })
);

/**
 * -----------------------
 * Health Check
 * -----------------------
 * Used by hosting platforms & monitoring
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * -----------------------
 * Routes
 * -----------------------
 * (Mounted, not implemented here)
 */
import authRoutes from './routes/auth.routes.js';
import storeRoutes from './routes/store.routes.js';
import medicineRoutes from './routes/medicine.routes.js';
import batchRoutes from './routes/batch.routes.js';
import purchaseRoutes from './routes/purchase.routes.js';
import saleRoutes from './routes/sale.routes.js';
import customerRoutes from './routes/customer.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import discountRoutes from './routes/discount.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import symptomRoutes from './routes/symptom.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import auditRoutes from './routes/audit.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import reorderRoutes from './routes/reorder.routes.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/store', storeRoutes);
app.use('/api/v1/medicines', medicineRoutes);
app.use('/api/v1/batch', batchRoutes);
app.use('/api/v1/purchase', purchaseRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/discount', discountRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/symptoms', symptomRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/reorder-suggestions', reorderRoutes);

/**
 * -----------------------
 * Error Handler (LAST)
 * -----------------------
 */
app.use(errorHandler);

import { startScheduler } from './utils/scheduler.js';
import { WhatsappService } from './modules/whatsapp/services/whatsapp.service.js';
import { startNightlyJob } from './services/rollupJob.js';

/**
 * -----------------------
 * Server Boot
 * -----------------------
 */
const startServer = async () => {
  await connectDB();
  
  // Start the background scheduler
  startScheduler();
  startNightlyJob();

  // Load existing active WhatsApp sessions on boot
  await WhatsappService.loadExistingSessions();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

startServer();

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  try {
    await WhatsappService.cleanup();
    // Give sockets 2 seconds to send final close frames to WhatsApp servers.
    // Without this, the TCP connection drops abruptly and the old session remains
    // "open" on WhatsApp's side for a few seconds, causing 440 on next boot.
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("[Server] Graceful shutdown cleanup complete. Exiting.");
  } catch (err) {
    console.error("[Server] Error during WhatsApp cleanup:", err);
  }
  process.exit(0);
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGUSR2", () => handleShutdown("SIGUSR2")); // nodemon restart

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Fatal] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Fatal] Uncaught Exception:", error);
});


