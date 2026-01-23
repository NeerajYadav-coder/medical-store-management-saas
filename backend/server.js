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

const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const connectDB = require('./config/db');

const errorHandler = require('./middleware/error.middleware');

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
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/store', require('./routes/store.routes'));
app.use('/api/v1/medicine', require('./routes/medicine.routes'));
app.use('/api/v1/batch', require('./routes/batch.routes'));
app.use('/api/v1/purchase', require('./routes/purchase.routes'));
app.use('/api/v1/sale', require('./routes/sale.routes'));
app.use('/api/v1/customer', require('./routes/customer.routes'));
app.use('/api/v1/supplier', require('./routes/supplier.routes'));
app.use('/api/v1/discount', require('./routes/discount.routes'));
app.use('/api/v1/dashboard', require('./routes/dashboard.routes'));

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
