const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { connectDB } = require('./db/mysql');  // MySQL connection function
// const authRoutes = require('./routes/authRoutes'); // Routes
const User = require('./models/User'); // User model

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
// app.use('/api/auth', authRoutes);

// Connect to DB
connectDB();

// Sync Models (Create or update tables)
User.sync({ alter: true })
  .then(() => console.log('🧩 User table synced successfully.'))
  .catch((err) => console.error('❌ Error syncing User table:', err));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
