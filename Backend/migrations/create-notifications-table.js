import { sequelize } from '../db/mysql.js';
import dotenv from 'dotenv';
dotenv.config();

const createNotificationsTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Check if table exists
    const [results] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Notifications'
    `);

    if (results.length > 0) {
      console.log('✅ Notifications table already exists');
      process.exit(0);
    }

    // Create Notifications table
    await sequelize.query(`
      CREATE TABLE Notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('sample', 'report', 'booking', 'system') NOT NULL DEFAULT 'system',
        read BOOLEAN NOT NULL DEFAULT FALSE,
        metadata JSON NULL,
        deletedAt BIGINT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Successfully created Notifications table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    if (error.message.includes('already exists')) {
      console.log('✅ Table already exists');
      process.exit(0);
    }
    process.exit(1);
  }
};

createNotificationsTable();

