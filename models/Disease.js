const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Disease = sequelize.define('Disease', {
  label: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name_en: {
    type: DataTypes.STRING,
    allowNull: true
  },
  severity: {
    type: DataTypes.STRING,
    allowNull: true
  },
  severityLabel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  symptoms: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  treatments: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'diseases',
  timestamps: true
});

module.exports = Disease;
