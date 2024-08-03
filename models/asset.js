'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Asset extends Model {
    static associate(models) {
      Asset.belongsTo(models.AssetCategory, {
        foreignKey: 'assetCategoryId',
        as: 'category'
      });
      // Asset.belongsTo(models.Employee, { foreignKey: 'employeeId' });
      Asset.hasMany(models.Issue, { foreignKey: 'assetId' });
      Asset.hasMany(models.Returndata, { foreignKey: 'assetId' });
      Asset.hasMany(models.ScrapAsset, { foreignKey: 'assetId' });
    }
  }

  Asset.init({
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    uniqueId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    make: {
      type: DataTypes.STRING,
      allowNull: false
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false
    },
    assetCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cost: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Asset',
  });

  return Asset;
};
