const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get referral overview
router.get('/overview', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's referral code
    const [users] = await pool.execute(
      'SELECT referral_code FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const referralCode = users[0].referral_code;

    // Get direct referrals (level 1)
    const [level1Referrals] = await pool.execute(
      `SELECT 
        u.user_id, u.name, u.email, u.phone, u.created_at,
        n.level1_business, n.level1_income
      FROM users u 
      LEFT JOIN network n ON u.user_id = n.user_id
      WHERE u.referred_by = ?`,
      [userId]
    );

    // Get level 2 referrals (referrals of referrals)
    const [level2Referrals] = await pool.execute(
      `SELECT 
        u.user_id, u.name, u.email, u.phone, u.created_at,
        n.level1_business, n.level1_income
      FROM users u 
      LEFT JOIN network n ON u.user_id = n.user_id
      WHERE u.referred_by IN (
        SELECT user_id FROM users WHERE referred_by = ?
      )`,
      [userId]
    );

    // Get network earnings
    const [networkData] = await pool.execute(
      'SELECT level1_income, level2_income, level1_business, level2_business FROM network WHERE user_id = ?',
      [userId]
    );

    // Get referral link
    const referralLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${referralCode}`;

    const referralData = {
      referralCode,
      referralLink,
      level1Referrals: level1Referrals.map(ref => ({
        ...ref,
        level1_business: ref.level1_business || 0,
        level1_income: ref.level1_income || 0
      })),
      level2Referrals: level2Referrals.map(ref => ({
        ...ref,
        level1_business: ref.level1_business || 0,
        level1_income: ref.level1_income || 0
      })),
      level1Income: networkData[0]?.level1_income || 0,
      level2Income: networkData[0]?.level2_income || 0,
      level1Business: networkData[0]?.level1_business || 0,
      level2Business: networkData[0]?.level2_business || 0,
      totalReferrals: level1Referrals.length + level2Referrals.length
    };

    res.json(referralData);
  } catch (error) {
    console.error('Referral overview error:', error);
    res.status(500).json({ error: 'Server error while fetching referral data' });
  }
});

// Get referral earnings history
router.get('/earnings', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    // Get referral bonus transactions
    const [transactions] = await pool.execute(
      `SELECT 
        t.*,
        u.name as referred_user_name
      FROM transactions t
      LEFT JOIN users u ON t.description LIKE CONCAT('%', u.name, '%')
      WHERE t.user_id = ? AND t.type = 'referral_bonus'
      ORDER BY t.timestamp DESC
      LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), (page - 1) * limit]
    );

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM transactions WHERE user_id = ? AND type = "referral_bonus"',
      [userId]
    );

    const total = countResult[0].total;

    res.json({
      earnings: transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Referral earnings error:', error);
    res.status(500).json({ error: 'Server error while fetching referral earnings' });
  }
});

// Get referral statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get monthly referral earnings
    const [monthlyEarnings] = await pool.execute(
      `SELECT 
        DATE_FORMAT(timestamp, '%Y-%m') as month,
        SUM(amount) as total_earnings,
        COUNT(*) as referral_count
      FROM transactions 
      WHERE user_id = ? AND type = 'referral_bonus' AND status = 'completed'
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12`,
      [userId]
    );

    // Get referral growth over time
    const [referralGrowth] = await pool.execute(
      `SELECT 
        DATE_FORMAT(u.created_at, '%Y-%m') as month,
        COUNT(*) as new_referrals
      FROM users u
      WHERE u.referred_by = ?
      GROUP BY DATE_FORMAT(u.created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12`,
      [userId]
    );

    // Get top performing referrals
    const [topReferrals] = await pool.execute(
      `SELECT 
        u.name,
        u.email,
        n.level1_business,
        n.level1_income
      FROM users u
      LEFT JOIN network n ON u.user_id = n.user_id
      WHERE u.referred_by = ?
      ORDER BY n.level1_business DESC
      LIMIT 5`,
      [userId]
    );

    res.json({
      monthlyEarnings,
      referralGrowth,
      topReferrals
    });

  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({ error: 'Server error while fetching referral statistics' });
  }
});

// Generate new referral code (optional feature)
router.post('/generate-code', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Generate unique referral code
    const generateCode = () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    let newCode = generateCode();
    let attempts = 0;

    // Ensure uniqueness
    while (attempts < 10) {
      const [existingCodes] = await pool.execute(
        'SELECT user_id FROM users WHERE referral_code = ?',
        [newCode]
      );
      if (existingCodes.length === 0) break;
      newCode = generateCode();
      attempts++;
    }

    // Update user's referral code
    await pool.execute(
      'UPDATE users SET referral_code = ? WHERE user_id = ?',
      [newCode, userId]
    );

    res.json({
      message: 'New referral code generated successfully',
      newReferralCode: newCode,
      referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${newCode}`
    });

  } catch (error) {
    console.error('Generate referral code error:', error);
    res.status(500).json({ error: 'Server error while generating referral code' });
  }
});

module.exports = router;
