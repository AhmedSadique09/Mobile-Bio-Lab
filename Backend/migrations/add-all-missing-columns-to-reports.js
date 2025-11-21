import { sequelize } from '../db/mysql.js';
import dotenv from 'dotenv';
dotenv.config();

const addMissingColumns = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Get all existing columns
    const [existingColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Reports'
    `);

    const existingColumnNames = existingColumns.map(col => col.COLUMN_NAME.toLowerCase());
    console.log('Existing columns:', existingColumnNames);

    // Define all required columns from the model
    const requiredColumns = [
      { name: 'fileSize', type: 'INT NULL', comment: 'File size in bytes' },
      { name: 'metadata', type: 'JSON NULL', comment: 'Additional report metadata' },
      { name: 'status', type: "ENUM('generating', 'completed', 'failed') DEFAULT 'generating'" },
      { name: 'errorMessage', type: 'TEXT NULL' }
    ];

    // Add missing columns
    for (const col of requiredColumns) {
      if (!existingColumnNames.includes(col.name.toLowerCase())) {
        try {
          await sequelize.query(`
            ALTER TABLE Reports 
            ADD COLUMN ${col.name} ${col.type}
            ${col.comment ? `COMMENT '${col.comment}'` : ''}
          `);
          console.log(`✅ Added column: ${col.name}`);
        } catch (error) {
          if (error.message.includes('Duplicate column name')) {
            console.log(`ℹ️  Column ${col.name} already exists`);
          } else {
            console.error(`❌ Error adding column ${col.name}:`, error.message);
          }
        }
      } else {
        console.log(`ℹ️  Column ${col.name} already exists`);
      }
    }

    console.log('✅ Migration completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in migration:', error.message);
    process.exit(1);
  }
};

addMissingColumns();

