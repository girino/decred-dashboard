'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('blocks', 'estimated_ticket_price',
     { type: Sequelize.DOUBLE,
       allowNull : true 
     });
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeColumn('blocks', 'estimated_ticket_price');
  }
};
