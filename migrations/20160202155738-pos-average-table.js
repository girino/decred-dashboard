'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('pos_average', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      day: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      timestamp: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      poolsize: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      poolsize_min: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      poolsize_max: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      sbits: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      sbits_min: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      sbits_max: {
        type: Sequelize.DOUBLE,
        allowNull: true
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
    return queryInterface.dropTable('pos_average');
  }
};
