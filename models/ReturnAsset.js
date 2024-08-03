'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Returndata extends Model {
    static associate(models) {
      Returndata.belongsTo(models.Asset, { foreignKey: 'assetId' });
      Returndata.belongsTo(models.Employee, { foreignKey: 'employeeId' });
    }
  }

  Returndata.init({
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
    modelName: 'Returndata',
    tableName: 'ReturnAssets',
    underscored: true,
    timestamps: true
  });

  return Returndata;
};
