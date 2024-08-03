'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ScrapAssets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      asset_id: { // Column name in the database with underscore
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Assets', // Table name
          key: 'id' // Column name in Assets table
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      scrap_date: { // Column name in the database with underscore
        type: Sequelize.DATE,
        allowNull: false
      },
      scrap_reason: { // Column name in the database with underscore
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ScrapAssets');
  }
};
