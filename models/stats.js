"use strict";

module.exports = function(sequelize, DataTypes) {
  var Stats = sequelize.define('Stats', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    blocks: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    difficulty: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    networkhashps: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    pooledtx: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fees: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    max_fees: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    btc_high: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    btc_low: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    btc_last: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    prev_day: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    btc_volume: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    usd_price: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE
    },
    updatedAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'stats'
  });

  return Stats;
};
