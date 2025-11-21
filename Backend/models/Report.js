import { DataTypes } from 'sequelize';
import { sequelize } from '../db/mysql.js';
import User from './User.js';

const Report = sequelize.define('Report', {
  reportType: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'custom', 'user', 'admin'),
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null for system-wide reports
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  generatedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: true // Allow null initially, will be set when report is generated
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'File size in bytes'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional report metadata (sample count, filters, etc.)'
  },
  status: {
    type: DataTypes.ENUM('generating', 'completed', 'failed'),
    defaultValue: 'generating'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deletedAt: { type: DataTypes.BIGINT, allowNull: true }
}, {
  timestamps: true,
  paranoid: false
});

// Define associations
Report.belongsTo(User, { foreignKey: 'userId', as: 'User' });
Report.belongsTo(User, { foreignKey: 'generatedBy', as: 'GeneratedBy' });

export default Report;

