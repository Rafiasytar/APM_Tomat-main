const { Sequelize } = require('sequelize');
require('dotenv').config();

const config = {
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "db_tomat",
  host: process.env.DB_HOST || "localhost",
  dialect: "mysql",
  logging: false
};

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: config.logging
});

module.exports = sequelize;
