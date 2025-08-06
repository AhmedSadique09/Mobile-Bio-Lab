import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Sequelize instance
export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
  }
);

// DB Connect function
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL database via Sequelize');
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
  }
};
