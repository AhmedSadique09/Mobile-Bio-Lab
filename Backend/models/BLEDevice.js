import { DataTypes } from 'sequelize';
import { sequelize } from '../db/mysql.js';
import User from './User.js';

const BLEDevice = sequelize.define('BLEDevice', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  deviceName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  deviceType: {
    type: DataTypes.ENUM('temperature', 'pH', 'salinity', 'environmental', 'multi-sensor', 'other'),
    allowNull: false
  },
  manufacturer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isConnected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastConnectedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  deletedAt: { type: DataTypes.BIGINT, allowNull: true }
}, {
  timestamps: true,
  paranoid: false
});

// Define associations
BLEDevice.belongsTo(User, { foreignKey: 'userId', as: 'User' });

export default BLEDevice;

