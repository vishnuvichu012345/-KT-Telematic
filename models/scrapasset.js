// models/scrapasset.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ScrapAsset extends Model {
    static associate(models) {
      ScrapAsset.belongsTo(models.Asset, { foreignKey: 'assetId' });
    }
  }

  ScrapAsset.init({
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
    scrapDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'scrap_date' // Specify the actual column name
    },
    scrapReason: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'scrap_reason' // Specify the actual column name
    }
  }, {
    sequelize,
    modelName: 'ScrapAsset',
    tableName: 'ScrapAssets',
    underscored: true,
    timestamps: true
  });

  return ScrapAsset;
};
