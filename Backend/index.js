import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import authRoutes from './routes/auth.routes.js';
import bodyParser from 'body-parser';
import { sequelize } from './db/mysql.js';
import './models/User.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.config.js';
import cors from 'cors';

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow frontend origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ statusCode: err.status || 500, message: err.message || 'Server error' });
});

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    // Sync models to add missing columns (careful in production):
    await sequelize.sync({ alter: true });
    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log('Server running on port', port));
  } catch (err) {
    console.error('Failed to start', err);
  }
};

start();
