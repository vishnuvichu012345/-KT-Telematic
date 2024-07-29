'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Asset extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define association here
      Asset.belongsTo(models.AssetCategory, {
        foreignKey: 'assetCategoryId',
        as: 'category'
      });
      Asset.hasMany(models.Issue, { foreignKey: 'assetId' }); // Added this line
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
