'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Assets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      serialNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      uniqueId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      make: {
        type: Sequelize.STRING,
        allowNull: false
      },
      model: {
        type: Sequelize.STRING,
        allowNull: false
      },
      assetCategoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'AssetCategories',
          key: 'id'
        }
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      purchaseDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cost: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Assets');
  }
};
