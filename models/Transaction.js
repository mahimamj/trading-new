const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  transactionId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'deposit',
      'withdrawal',
      'transfer',
      'payment',
      'refund',
      'fee',
      'bonus',
      'exchange'
    ),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'reversed'
    ),
    defaultValue: 'pending'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD',
    allowNull: false
  },
  fee: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00
  },
  netAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  paymentMethod: {
    type: DataTypes.ENUM(
      'bank_transfer',
      'card',
      'upi',
      'wallet',
      'qr_code',
      'crypto'
    ),
    allowNull: true
  },
  paymentGateway: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gatewayTransactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gatewayResponse: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failureReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isReversible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  reversedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reversalReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: (transaction) => {
      if (!transaction.transactionId) {
        transaction.transactionId = generateTransactionId();
      }
      if (!transaction.netAmount) {
        transaction.netAmount = parseFloat(transaction.amount) - parseFloat(transaction.fee || 0);
      }
    }
  }
});

// Helper function to generate transaction ID
function generateTransactionId() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN${timestamp}${random}`;
}

module.exports = Transaction;
