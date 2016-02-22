'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('blocks', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      hash: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      height: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      datetime: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      voters: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      poolsize: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      sbits: {
        type: Sequelize.DOUBLE,
        allowNull: false
      },
      difficulty: {
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
    return queryInterface.dropTable('blocks');
  }
};
