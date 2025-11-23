import { sequelize } from '../db/mysql.js';
import dotenv from 'dotenv';
dotenv.config();

const createProtocolsTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Check if table exists (check both cases)
    const [results] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND (TABLE_NAME = 'Protocols' OR TABLE_NAME = 'protocols')
    `);

    // Drop table if it exists (to recreate with correct structure)
    if (results.length > 0) {
      const tableName = results[0].TABLE_NAME;
      console.log(`⚠️  Table '${tableName}' exists. Dropping to recreate...`);
      await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      console.log(`✅ Dropped existing table '${tableName}'`);
    }

    // Create Protocols table (using lowercase to match Sequelize default on some systems)
    await sequelize.query(`
      CREATE TABLE protocols (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        category ENUM('water-analysis', 'soil-analysis', 'plant-analysis', 'biological-fluids', 'general', 'other') NOT NULL DEFAULT 'general',
        steps JSON NULL,
        difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
        isPublished BOOLEAN NOT NULL DEFAULT FALSE,
        createdBy INT NOT NULL,
        lastUpdatedBy INT NULL,
        viewCount INT NOT NULL DEFAULT 0,
        deletedAt BIGINT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
      FOREIGN KEY (createdBy) REFERENCES Users(id) ON DELETE CASCADE,
      FOREIGN KEY (lastUpdatedBy) REFERENCES Users(id) ON DELETE SET NULL,
        INDEX idx_category (category),
        INDEX idx_isPublished (isPublished),
        INDEX idx_difficulty (difficulty)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Successfully created Protocols table');
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

createProtocolsTable();

