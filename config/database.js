const { Sequelize } = require('sequelize');

const config = {
  username: "root",
  password: "Tarompa1",
  database: "db_tomat",
  host: "localhost",
  dialect: "mysql",
  logging: false
};

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: config.logging
});

module.exports = sequelize;
