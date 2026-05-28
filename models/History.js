const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const History = sequelize.define('History', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  disease_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  severity: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accuracy: {
    type: DataTypes.DECIMAL(10, 0),
    allowNull: true
  },
  img_path: {
    type: DataTypes.STRING,
    allowNull: true
  },
  result_json: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'predictions',
  timestamps: true
});

module.exports = History;
