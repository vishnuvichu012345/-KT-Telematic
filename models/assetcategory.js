'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AssetCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define association here
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
    }
  }, {
    sequelize,
    modelName: 'AssetCategory',
  });

  return AssetCategory;
};
