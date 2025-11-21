import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import sampleRoutes from './routes/sample.routes.js';
import scanEventRoutes from './routes/scanEvent.routes.js';
import bleRoutes from './routes/ble.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import reportRoutes from './routes/report.routes.js';
import protocolRoutes from './routes/protocol.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import bodyParser from 'body-parser';
import { sequelize } from './db/mysql.js';
import './models/User.js';
import './models/Booking.js';
import './models/Sample.js';
import './models/ScanEvent.js';
import './models/Report.js';
import './models/Protocol.js';
import './models/Notification.js';
import { startScheduler } from './services/reportScheduler.service.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.config.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow frontend origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length']
}));

app.use(bodyParser.json());

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from reports folder
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/sample', sampleRoutes);
app.use('/api/scan-event', scanEventRoutes);
app.use('/api/ble', bleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/protocols', protocolRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ statusCode: err.status || 500, message: err.message || 'Server error' });
});

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // Sync models - only create tables if they don't exist
    // Using sync without alter to avoid "Too many keys" error
    try {
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synced');
    } catch (syncErr) {
      // If sync fails, try to continue without altering
      if (syncErr.message && syncErr.message.includes('Too many keys')) {
        console.warn('⚠️  Database sync skipped (too many keys). Tables may need manual migration.');
      } else {
        console.warn('⚠️  Database sync warning:', syncErr.message);
      }
    }

    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      // Start automatic report generation scheduler
      startScheduler();
    });
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    if (err.original && err.original.code === 'ECONNREFUSED') {
      console.error('\n💡 Database Connection Error:');
      console.error('   - Make sure MySQL server is running');
      console.error('   - Check your .env file for correct database credentials');
      console.error('   - Verify DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME');
      console.error('   - Create the database if it doesn\'t exist: CREATE DATABASE mobile_bio_lab;');
    }
    process.exit(1);
  }
};

start();
