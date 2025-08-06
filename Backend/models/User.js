const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/mysql');

const User = sequelize.define('User', {
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  vuId: { type: DataTypes.STRING, unique: true },
  email: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING,
  mobile: DataTypes.STRING,
  role: DataTypes.ENUM('Student', 'Researcher', 'Technician'),
  city: DataTypes.STRING,
  profilePicture: DataTypes.STRING,
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = User;
