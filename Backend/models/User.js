import { DataTypes } from 'sequelize';
import { sequelize } from '../db/mysql.js';

const User = sequelize.define('User', {
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  vuId: { type: DataTypes.STRING, unique: true },
  email: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING,
  mobile: DataTypes.STRING,
  role: DataTypes.ENUM('Student', 'Researcher', 'Technician','Admin'),
  city: DataTypes.STRING,
  profilePicture: DataTypes.STRING,
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false }
});

export default User;
