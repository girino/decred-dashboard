'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('stats', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      blocks: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      difficulty: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      networkhashps: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      pooledtx: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      btc_high: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      btc_low: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      btc_last: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      btc_volume: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      usd_price: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    }, {charset : 'utf8'});
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('stats');
  }
};
