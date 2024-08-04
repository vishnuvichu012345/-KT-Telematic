'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ReturnAssets', { // Table name
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
      employee_id: { // Column name in the database with underscore
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Employees', // Table name
          key: 'id' // Column name in Employees table
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      return_date: { // Column name in the database with underscore
        type: Sequelize.DATE,
        allowNull: false
      },
      return_reason: { // Column name in the database with underscore
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
    await queryInterface.dropTable('ReturnAssets');
  }
};
