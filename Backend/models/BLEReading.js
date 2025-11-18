import { DataTypes } from 'sequelize';
import { sequelize } from '../db/mysql.js';
import BLEDevice from './BLEDevice.js';
import User from './User.js';

const BLEReading = sequelize.define('BLEReading', {
  deviceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'BLEDevices',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  temperature: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  pH: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  salinity: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  humidity: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  pressure: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  light: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  co2: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true
  },
  rawData: {
    type: DataTypes.JSON,
    allowNull: true
  },
  readingTimestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  deletedAt: { type: DataTypes.BIGINT, allowNull: true }
}, {
  timestamps: true,
  paranoid: false
});

// Define associations
BLEReading.belongsTo(BLEDevice, { foreignKey: 'deviceId', as: 'Device' });
BLEReading.belongsTo(User, { foreignKey: 'userId', as: 'User' });

export default BLEReading;

