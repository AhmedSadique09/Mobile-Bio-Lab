import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME || "mobile_bio_lab",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "", 
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 2,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false
    },
    dialectOptions: {
      charset: 'utf8mb4'
    }
  }
);

// DB Connect function
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to MySQL database via Sequelize");
    
    // Test a simple query to ensure connection is working
    await sequelize.query('SELECT 1');
    console.log("✅ Database connection test successful");
    
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    console.log("💡 Make sure MySQL is running and database 'mobile_bio_lab' exists");
    console.log("💡 You can create database with: CREATE DATABASE mobile_bio_lab;");
    console.log("⚠️  Server will continue without database connection");
  }
};
