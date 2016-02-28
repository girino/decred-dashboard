'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('stats', 'avg_sbits',
     { type: Sequelize.DOUBLE,
       allowNull : true 
     });
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeColumn('stats', 'avg_sbits');
  }
};
