"use strict";

module.exports = function(sequelize, DataTypes) {
  var Prices = sequelize.define('Prices', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    dcr_btc: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    btc_usd: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    dcr_usd: {
      type: DataTypes.DOUBLE,
      allowNull: true
    },
    datetime: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE
    },
    updatedAt: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'prices'
  });

  return Prices;
};
