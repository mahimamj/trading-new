const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Wallet = sequelize.define('Wallet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastTransactionAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dailyLimit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 50000.00
  },
  monthlyLimit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 500000.00
  },
  dailySpent: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  monthlySpent: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  lastResetDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Wallet;
