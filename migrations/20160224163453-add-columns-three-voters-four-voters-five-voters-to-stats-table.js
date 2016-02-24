'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return [
      queryInterface.addColumn(
        'stats',
        'three_voters',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'stats',
        'four_voters',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'stats',
        'five_voters',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        }
      )
    ];
  },

  down: function (queryInterface, Sequelize) {
    return [
      queryInterface.removeColumn('stats', 'three_voters'),
      queryInterface.removeColumn('stats', 'four_voters'),
      queryInterface.removeColumn('stats', 'five_voters'),
    ];
  }
};