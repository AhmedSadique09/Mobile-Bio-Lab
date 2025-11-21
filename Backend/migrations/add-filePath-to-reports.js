import { sequelize } from '../db/mysql.js';
import dotenv from 'dotenv';
dotenv.config();

const addFilePathColumn = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Reports' 
      AND COLUMN_NAME = 'filePath'
    `);

    if (results.length > 0) {
      console.log('✅ Column "filePath" already exists in Reports table');
      process.exit(0);
    }

    // Add the column as nullable
    await sequelize.query(`
      ALTER TABLE Reports 
      ADD COLUMN filePath VARCHAR(500) NULL
    `);

    console.log('✅ Successfully added "filePath" column to Reports table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding column:', error.message);
    if (error.message.includes('Duplicate column name')) {
      console.log('✅ Column already exists');
      process.exit(0);
    }
    process.exit(1);
  }
};

addFilePathColumn();

