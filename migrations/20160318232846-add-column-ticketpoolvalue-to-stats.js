'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('stats', 'ticketpoolvalue',
     { type: Sequelize.DOUBLE,
       allowNull : true 
     });
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeColumn('stats', 'ticketpoolvalue');
  }
};
