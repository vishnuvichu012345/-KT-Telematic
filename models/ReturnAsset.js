'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ReturnAsset extends Model {
    static associate(models) {
      ReturnAsset.belongsTo(models.Asset, { foreignKey: 'assetId' });
      ReturnAsset.belongsTo(models.Employee, { foreignKey: 'employeeId' });
    }
  }

  ReturnAsset.init({
    assetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Assets',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      field: 'asset_id' // Specify the actual column name
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Employees',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      field: 'employee_id' // Specify the actual column name
    },
    returnDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'return_date' // Specify the actual column name
    },
    returnReason: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'return_reason' // Specify the actual column name
    }
  }, {
    sequelize,
    modelName: 'ReturnAsset',
    tableName: 'ReturnAssets',
    underscored: true,
    timestamps: true
  });

  return ReturnAsset;
};
