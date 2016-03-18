'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('stats', 'prev_est_sbits',
     { type: Sequelize.DOUBLE,
       allowNull : true 
     });
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeColumn('stats', 'prev_est_sbits');
  }
};
