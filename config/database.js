const { Sequelize } = require('sequelize');
require('dotenv').config();

const useSSL = process.env.DB_SSL === 'true';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: useSSL
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
});

module.exports = sequelize;