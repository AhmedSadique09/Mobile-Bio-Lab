import { DataTypes } from 'sequelize';
import { sequelize } from '../db/mysql.js';
import User from './User.js';

const Booking = sequelize.define('Booking', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  timeSlot: {
    type: DataTypes.STRING,
    allowNull: false
  },
  purpose: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
    defaultValue: 'pending'
  },
  deletedAt: { type: DataTypes.BIGINT, allowNull: true }
}, {
  timestamps: true,
  paranoid: false
});

// Define associations
Booking.belongsTo(User, { foreignKey: 'userId', as: 'User' });

export default Booking;

