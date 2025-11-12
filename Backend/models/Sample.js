import { DataTypes } from 'sequelize';
import { sequelize } from '../db/mysql.js';
import User from './User.js';

const Sample = sequelize.define('Sample', {
  sampleId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  collectionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  collectionTime: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sampleType: {
    type: DataTypes.ENUM('water', 'soil', 'plant', 'biological-fluids', 'other'),
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
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
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed'),
    defaultValue: 'pending'
  },
  deletedAt: { type: DataTypes.BIGINT, allowNull: true }
}, {
  timestamps: true,
  paranoid: false
});

// Define associations
Sample.belongsTo(User, { foreignKey: 'userId', as: 'User' });

export default Sample;

