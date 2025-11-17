import { DataTypes } from 'sequelize';
import { sequelize } from '../db/mysql.js';
import User from './User.js';

const ScanEvent = sequelize.define('ScanEvent', {
  scannedSampleId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'The sampleId that was scanned from QR/barcode'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  deviceType: {
    type: DataTypes.ENUM('mobile', 'scanner', 'browser'),
    allowNull: false,
    defaultValue: 'mobile'
  },
  scanResult: {
    type: DataTypes.ENUM('found', 'not_found'),
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata from QR code if available'
  },
  deletedAt: { type: DataTypes.BIGINT, allowNull: true }
}, {
  timestamps: true,
  paranoid: false
});

// Define associations
ScanEvent.belongsTo(User, { foreignKey: 'userId', as: 'User' });

export default ScanEvent;
