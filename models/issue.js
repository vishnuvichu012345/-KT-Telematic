'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Issue extends Model {
    static associate(models) {
      Issue.belongsTo(models.Asset, { foreignKey: 'assetId' });
      Issue.belongsTo(models.Employee, { foreignKey: 'employeeId' });
    }
  }

  Issue.init({
    assetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    issueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isReturned: {  // New column for soft delete
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,  // Default to false, meaning not returned
    },
  }, {
    sequelize,
    modelName: 'Issue',
  });

  return Issue;
};
