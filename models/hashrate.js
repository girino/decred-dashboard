"use strict";

module.exports = function(sequelize, DataTypes) {
  var Hashrate = sequelize.define('Hashrate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    timestamp: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    networkhashps: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE
    },
    updatedAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'hashrate'
  });

  return Hashrate;
};
