const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Deposit funds
router.post('/deposit', [
  auth,
  body('amount').isFloat({ min: 100 }).withMessage('Minimum deposit amount is ₹100'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, description } = req.body;
    const userId = req.user.userId;

    // Create deposit transaction
    const [result] = await pool.execute(
      'INSERT INTO transactions (user_id, type, amount, status, description) VALUES (?, ?, ?, ?, ?)',
      [userId, 'deposit', amount, 'pending', description || 'Deposit request']
    );

    // Update user balance (will be updated to completed when admin approves)
    await pool.execute(
      'UPDATE users SET account_balance = account_balance + ? WHERE user_id = ?',
      [amount, userId]
    );

    res.status(201).json({
      message: 'Deposit request submitted successfully',
      transactionId: result.insertId,
      amount,
      status: 'pending'
    });

  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Server error during deposit' });
  }
});

// Withdraw funds
router.post('/withdraw', [
  auth,
  body('amount').isFloat({ min: 500 }).withMessage('Minimum withdrawal amount is ₹500'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, description } = req.body;
    const userId = req.user.userId;

    // Check if user has sufficient balance
    const [users] = await pool.execute(
      'SELECT account_balance FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentBalance = users[0].account_balance;
    if (currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance for withdrawal' });
    }

    // Create withdrawal transaction
    const [result] = await pool.execute(
      'INSERT INTO transactions (user_id, type, amount, status, description) VALUES (?, ?, ?, ?, ?)',
      [userId, 'withdraw', amount, 'pending', description || 'Withdrawal request']
    );

    // Deduct from balance (will be updated when admin processes)
    await pool.execute(
      'UPDATE users SET account_balance = account_balance - ? WHERE user_id = ?',
      [amount, userId]
    );

    res.status(201).json({
      message: 'Withdrawal request submitted successfully',
      transactionId: result.insertId,
      amount,
      status: 'pending'
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Server error during withdrawal' });
  }
});

// Get transaction history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, type, status } = req.query;

    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    let params = [userId];

    // Add filters
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Add pagination
    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), offset);

    const [transactions] = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
    let countParams = [userId];

    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Server error while fetching transaction history' });
  }
});

// Get transaction by ID
router.get('/transaction/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [transactions] = await pool.execute(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction: transactions[0] });
  } catch (error) {
    console.error('Transaction fetch error:', error);
    res.status(500).json({ error: 'Server error while fetching transaction' });
  }
});

// Cancel pending transaction
router.put('/transaction/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get transaction details
    const [transactions] = await pool.execute(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ? AND status = "pending"',
      [id, userId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or cannot be cancelled' });
    }

    const transaction = transactions[0];

    // Update transaction status
    await pool.execute(
      'UPDATE transactions SET status = "cancelled" WHERE id = ?',
      [id]
    );

    // Reverse balance changes for deposits
    if (transaction.type === 'deposit') {
      await pool.execute(
        'UPDATE users SET account_balance = account_balance - ? WHERE user_id = ?',
        [transaction.amount, userId]
      );
    }

    // Reverse balance changes for withdrawals
    if (transaction.type === 'withdraw') {
      await pool.execute(
        'UPDATE users SET account_balance = account_balance + ? WHERE user_id = ?',
        [transaction.amount, userId]
      );
    }

    res.json({ message: 'Transaction cancelled successfully' });
  } catch (error) {
    console.error('Transaction cancel error:', error);
    res.status(500).json({ error: 'Server error while cancelling transaction' });
  }
});

module.exports = router;
