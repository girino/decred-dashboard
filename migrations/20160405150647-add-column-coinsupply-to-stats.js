'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('stats', 'coinsupply',
     { type: Sequelize.BIGINT,
       allowNull : true 
     });
  },

  down: function (queryInterface, Sequelize) {
      return queryInterface.removeColumn('stats', 'coinsupply');
  }
};
