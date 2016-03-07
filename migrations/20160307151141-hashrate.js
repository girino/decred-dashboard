'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('hashrate', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      timestamp: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      networkhashps: {
        type: Sequelize.BIGINT,
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
    return queryInterface.dropTable('hashrate');
  }
};
