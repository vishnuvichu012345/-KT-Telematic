'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      Employee.hasMany(models.Issue, { foreignKey: 'employeeId' });
      Employee.hasMany(models.Returndata, { foreignKey: 'employeeId' });
      // Employee.hasMany(models.Asset, {foreignKey: 'employeeId' });

    }
  }

  Employee.init({
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    position: DataTypes.STRING,
    department: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Employee',
  });

  return Employee;
};
