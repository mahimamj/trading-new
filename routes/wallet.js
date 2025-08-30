const express = require('express');
const { body, validationResult } = require('express-validator');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { sendNotificationEmail } = require('../utils/emailService');
const { sendNotificationSMS } = require('../utils/smsService');

const router = express.Router();

// Get wallet balance
router.get('/balance', async (req, res) => {
  try {
    const { userId } = req.user;

    const wallet = await Wallet.findOne({
      where: { userId },
      include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      data: {
        balance: parseFloat(wallet.balance),
        currency: wallet.currency,
        dailyLimit: parseFloat(wallet.dailyLimit),
        monthlyLimit: parseFloat(wallet.monthlyLimit),
        dailySpent: parseFloat(wallet.dailySpent),
        monthlySpent: parseFloat(wallet.monthlySpent),
        lastTransactionAt: wallet.lastTransactionAt
      }
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add money to wallet
router.post('/add-money', [
  body('amount').isFloat({ min: 1 }),
  body('paymentMethod').isIn(['bank_transfer', 'card', 'upi']),
  body('currency').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.user;
    const { amount, paymentMethod, currency = 'USD' } = req.body;

    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Check transaction limits
    if (amount > wallet.dailyLimit) {
      return res.status(400).json({
        success: false,
        message: 'Amount exceeds daily limit'
      });
    }

    if (wallet.dailySpent + amount > wallet.dailyLimit) {
      return res.status(400).json({
        success: false,
        message: 'Amount would exceed daily limit'
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId,
      type: 'deposit',
      status: 'processing',
      amount,
      currency,
      paymentMethod,
      description: `Added ${amount} ${currency} to wallet via ${paymentMethod}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Update wallet
    wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
    wallet.dailySpent = parseFloat(wallet.dailySpent) + parseFloat(amount);
    wallet.monthlySpent = parseFloat(wallet.monthlySpent) + parseFloat(amount);
    wallet.lastTransactionAt = new Date();
    await wallet.save();

    // Update transaction status
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    await transaction.save();

    // Send notifications
    const user = await User.findByPk(userId);
    await sendNotificationEmail(user, 'transaction', {
      amount,
      currency,
      status: 'completed',
      transactionId: transaction.transactionId,
      type: 'deposit'
    });

    await sendNotificationSMS(user, 'transaction', {
      amount,
      status: 'completed',
      transactionId: transaction.transactionId
    });

    res.json({
      success: true,
      message: 'Money added successfully',
      data: {
        transaction: transaction.toJSON(),
        newBalance: parseFloat(wallet.balance)
      }
    });

  } catch (error) {
    console.error('Add money error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Transfer money to another user
router.post('/transfer', [
  body('recipientEmail').isEmail(),
  body('amount').isFloat({ min: 1 }),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.user;
    const { recipientEmail, amount, description = 'P2P Transfer' } = req.body;

    // Find recipient
    const recipient = await User.findOne({ where: { email: recipientEmail } });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    if (recipient.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to yourself'
      });
    }

    // Get sender's wallet
    const senderWallet = await Wallet.findOne({ where: { userId } });
    if (!senderWallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Check balance
    if (parseFloat(senderWallet.balance) < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Check limits
    if (amount > senderWallet.dailyLimit) {
      return res.status(400).json({
        success: false,
        message: 'Amount exceeds daily limit'
      });
    }

    if (senderWallet.dailySpent + amount > senderWallet.dailyLimit) {
      return res.status(400).json({
        success: false,
        message: 'Amount would exceed daily limit'
      });
    }

    // Get recipient's wallet
    const recipientWallet = await Wallet.findOne({ where: { userId: recipient.id } });
    if (!recipientWallet) {
      return res.status(404).json({
        success: false,
        message: 'Recipient wallet not found'
      });
    }

    // Create transactions
    const senderTransaction = await Transaction.create({
      userId,
      type: 'transfer',
      status: 'processing',
      amount: -amount,
      currency: senderWallet.currency,
      paymentMethod: 'wallet',
      description: `Transfer to ${recipient.email}: ${description}`,
      recipientId: recipient.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const recipientTransaction = await Transaction.create({
      userId: recipient.id,
      type: 'transfer',
      status: 'processing',
      amount,
      currency: recipientWallet.currency,
      paymentMethod: 'wallet',
      description: `Transfer from ${req.userData.email}: ${description}`,
      senderId: userId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Update wallets
    senderWallet.balance = parseFloat(senderWallet.balance) - parseFloat(amount);
    senderWallet.dailySpent = parseFloat(senderWallet.dailySpent) + parseFloat(amount);
    senderWallet.monthlySpent = parseFloat(senderWallet.monthlySpent) + parseFloat(amount);
    senderWallet.lastTransactionAt = new Date();
    await senderWallet.save();

    recipientWallet.balance = parseFloat(recipientWallet.balance) + parseFloat(amount);
    recipientWallet.lastTransactionAt = new Date();
    await recipientWallet.save();

    // Update transaction status
    senderTransaction.status = 'completed';
    senderTransaction.completedAt = new Date();
    await senderTransaction.save();

    recipientTransaction.status = 'completed';
    recipientTransaction.completedAt = new Date();
    await recipientTransaction.save();

    // Send notifications
    await sendNotificationEmail(req.userData, 'transaction', {
      amount,
      currency: senderWallet.currency,
      status: 'completed',
      transactionId: senderTransaction.transactionId,
      type: 'transfer',
      recipient: recipient.email
    });

    await sendNotificationEmail(recipient, 'transaction', {
      amount,
      currency: recipientWallet.currency,
      status: 'completed',
      transactionId: recipientTransaction.transactionId,
      type: 'transfer',
      sender: req.userData.email
    });

    res.json({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        transaction: senderTransaction.toJSON(),
        newBalance: parseFloat(senderWallet.balance)
      }
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Withdraw money
router.post('/withdraw', [
  body('amount').isFloat({ min: 1 }),
  body('bankDetails').isObject(),
  body('currency').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.user;
    const { amount, bankDetails, currency = 'USD' } = req.body;

    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Check balance
    if (parseFloat(wallet.balance) < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId,
      type: 'withdrawal',
      status: 'pending',
      amount: -amount,
      currency,
      paymentMethod: 'bank_transfer',
      description: `Withdrawal to bank account`,
      metadata: { bankDetails },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Update wallet
    wallet.balance = parseFloat(wallet.balance) - parseFloat(amount);
    wallet.lastTransactionAt = new Date();
    await wallet.save();

    // Send notifications
    const user = await User.findByPk(userId);
    await sendNotificationEmail(user, 'transaction', {
      amount,
      currency,
      status: 'pending',
      transactionId: transaction.transactionId,
      type: 'withdrawal'
    });

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        transaction: transaction.toJSON(),
        newBalance: parseFloat(wallet.balance)
      }
    });

  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get transaction history
router.get('/transactions', async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 10, type, status, startDate, endDate } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { userId };

    // Add filters
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.$gte = new Date(startDate);
      if (endDate) whereClause.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        transactions: transactions.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(transactions.count / limit),
          totalItems: transactions.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
