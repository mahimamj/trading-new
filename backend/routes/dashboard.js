const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview data
router.get('/overview', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user data
    const [users] = await pool.execute(
      'SELECT account_balance, total_earning, rewards FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get network data
    const [networkData] = await pool.execute(
      'SELECT level1_income, level2_income, level1_business, level2_business FROM network WHERE user_id = ?',
      [userId]
    );

    // Get referral count
    const [referrals] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE referred_by = ?',
      [userId]
    );

    // Get recent transactions
    const [transactions] = await pool.execute(
      'SELECT type, amount, status, timestamp FROM transactions WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5',
      [userId]
    );

    const dashboardData = {
      accountBalance: users[0].account_balance || 0,
      totalEarnings: users[0].total_earning || 0,
      rewards: users[0].rewards || 0,
      level1Income: networkData[0]?.level1_income || 0,
      level2Income: networkData[0]?.level2_income || 0,
      level1Business: networkData[0]?.level1_business || 0,
      level2Business: networkData[0]?.level2_business || 0,
      referralCount: referrals[0]?.count || 0,
      recentTransactions: transactions
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Server error while fetching dashboard data' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.execute(
      'SELECT name, email, phone, referral_code, account_balance, total_earning, rewards, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    await pool.execute(
      'UPDATE users SET name = ?, phone = ? WHERE user_id = ?',
      [name, phone, userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
});

// Get statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get monthly earnings
    const [monthlyEarnings] = await pool.execute(
      `SELECT 
        DATE_FORMAT(timestamp, '%Y-%m') as month,
        SUM(CASE WHEN type = 'referral_bonus' THEN amount ELSE 0 END) as referral_income,
        SUM(CASE WHEN type = 'reward' THEN amount ELSE 0 END) as reward_income
      FROM transactions 
      WHERE user_id = ? AND status = 'completed'
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6`,
      [userId]
    );

    // Get transaction counts by type
    const [transactionCounts] = await pool.execute(
      `SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM transactions 
      WHERE user_id = ? AND status = 'completed'
      GROUP BY type`,
      [userId]
    );

    res.json({
      monthlyEarnings,
      transactionCounts
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Server error while fetching statistics' });
  }
});

module.exports = router;
