import { DataTypes } from 'sequelize';
import { sequelize } from '../db/mysql.js';

const User = sequelize.define('User', {
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  email: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING,
  mobile: DataTypes.STRING,
  role: DataTypes.ENUM('Student', 'Researcher', 'Technician', 'Admin'),
  city: DataTypes.STRING,
  profilePicture: DataTypes.STRING,
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActivated: { type: DataTypes.BOOLEAN, defaultValue: false },
  otp: { type: DataTypes.STRING, allowNull: true },
  otpExpireAt: { type: DataTypes.BIGINT, allowNull: true },
  deletedAt: { type: DataTypes.BIGINT, allowNull: true }
}, {
  timestamps: true,
  paranoid: false
});

export default User;
