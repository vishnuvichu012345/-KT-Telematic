'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Assets', 'location', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Assets', 'purchaseDate', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Assets', 'cost', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Assets', 'location');
    await queryInterface.removeColumn('Assets', 'purchaseDate');
    await queryInterface.removeColumn('Assets', 'cost');
  }
};
