'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AssetCategory extends Model {
    static associate(models) {
      AssetCategory.hasMany(models.Asset, {
        foreignKey: 'assetCategoryId',
        as: 'assets'
      });
    }
  }

  AssetCategory.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING, // Ensure this line is present
      allowNull: true // You can set this to false if description is required
    }
  }, {
    sequelize,
    modelName: 'AssetCategory',
  });

  return AssetCategory;
};
