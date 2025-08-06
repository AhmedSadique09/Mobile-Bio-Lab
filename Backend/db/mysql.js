const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('mobile_bio_lab', 'root', '@Ahmed123', {
  host: 'localhost',
  dialect: 'mysql',
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL database');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, connectDB };
