"use strict";

module.exports = function(sequelize, DataTypes) {
  var PosAvg = sequelize.define('PosAvg', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    day: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    timestamp: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    poolsize: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    poolsize_min: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    poolsize_max: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sbits: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    sbits_min: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    sbits_max: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE
    },
    updatedAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'pos_average'
  });

  return PosAvg;
};
