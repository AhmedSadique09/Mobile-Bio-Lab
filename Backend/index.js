import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { connectDB } from './db/mysql.js';
import User from './models/User.js';


dotenv.config();

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);


// DB Connection
connectDB();

// Sync MySQL models
User.sync()  // 👈 bas itna rakh do
  .then(() => {
    console.log('🧩 User table synced successfully.');
  })
  .catch((err) => console.error('❌ Error syncing User table:', err));

// Global Error Handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';
  res.status(status).json({ success: false, message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
