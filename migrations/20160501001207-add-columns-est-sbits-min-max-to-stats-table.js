'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return [
      queryInterface.addColumn(
        'stats',
        'est_sbits_min',
        {
          type: Sequelize.DOUBLE,
          allowNull: true
        }
      ),
      queryInterface.addColumn(
        'stats',
        'est_sbits_max',
        {
          type: Sequelize.DOUBLE,
          allowNull: true
        }
      )
    ];
  },

  down: function (queryInterface, Sequelize) {
    return [
      queryInterface.removeColumn('stats', 'est_sbits_min'),
      queryInterface.removeColumn('stats', 'est_sbits_max')
    ];
  }
};
