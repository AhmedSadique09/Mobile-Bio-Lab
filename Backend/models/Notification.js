import { DataTypes } from 'sequelize';
import { sequelize } from '../db/mysql.js';
import User from './User.js';

const Notification = sequelize.define('Notification', {
  userId: {
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
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('sample', 'report', 'booking', 'system'),
    allowNull: false,
    defaultValue: 'system'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional notification metadata (sampleId, reportId, etc.)'
  },
  deletedAt: { type: DataTypes.BIGINT, allowNull: true }
}, {
  timestamps: true,
  paranoid: false
});

// Define associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'User' });

export default Notification;

