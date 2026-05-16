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

import env from './config/env.js';
import connectDB from './config/db.js';

import errorHandler from './middleware/error.middleware.js';

// Initialize express app
const app = express();

/**
 * -----------------------
 * Global Middleware
 * -----------------------
 */

// Parse JSON bodies
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN,
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

/**
 * -----------------------
 * Error Handler (LAST)
 * -----------------------
 */
app.use(errorHandler);

/**
 * -----------------------
 * Server Boot
 * -----------------------
 */
const startServer = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

startServer();
