import { sequelize } from '../db/mysql.js';
import dotenv from 'dotenv';
dotenv.config();

const addGeneratedByColumn = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'Reports' 
      AND COLUMN_NAME = 'generatedBy'
    `);

    if (results.length > 0) {
      console.log('✅ Column "generatedBy" already exists in Reports table');
      process.exit(0);
    }

    // Add the column as nullable first
    await sequelize.query(`
      ALTER TABLE Reports 
      ADD COLUMN generatedBy INT NULL
    `);

    // Update existing rows - set generatedBy to userId if exists, otherwise to 1 (assuming admin user exists)
    await sequelize.query(`
      UPDATE Reports 
      SET generatedBy = COALESCE(userId, 1)
      WHERE generatedBy IS NULL
    `);

    // Now add the foreign key constraint
    await sequelize.query(`
      ALTER TABLE Reports 
      ADD CONSTRAINT fk_reports_generated_by 
      FOREIGN KEY (generatedBy) REFERENCES Users(id)
    `);

    // Make it NOT NULL after updating all rows
    await sequelize.query(`
      ALTER TABLE Reports 
      MODIFY COLUMN generatedBy INT NOT NULL
    `);

    console.log('✅ Successfully added "generatedBy" column to Reports table');
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

addGeneratedByColumn();

