const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Generate referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Register user
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('referralCode').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, password, referralCode } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT user_id FROM users WHERE email = ? OR phone = ?',
      [email, phone]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate unique referral code
    let referralCodeFinal = generateReferralCode();
    let attempts = 0;
    while (attempts < 10) {
      const [existingCodes] = await pool.execute(
        'SELECT user_id FROM users WHERE referral_code = ?',
        [referralCodeFinal]
      );
      if (existingCodes.length === 0) break;
      referralCodeFinal = generateReferralCode();
      attempts++;
    }

    // Check if referral code is valid
    let referredBy = null;
    if (referralCode) {
      const [referrer] = await pool.execute(
        'SELECT user_id FROM users WHERE referral_code = ?',
        [referralCode]
      );
      if (referrer.length > 0) {
        referredBy = referrer[0].user_id;
      }
    }

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, phone, password_hash, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, passwordHash, referralCodeFinal, referredBy]
    );

    const userId = result.insertId;

    // Create network record
    await pool.execute(
      'INSERT INTO network (user_id) VALUES (?)',
      [userId]
    );

    // If user was referred, add referral bonus
    if (referredBy) {
      // Add referral bonus to referrer
      await pool.execute(
        'UPDATE network SET level1_income = level1_income + 100, level1_business = level1_business + 100 WHERE user_id = ?',
        [referredBy]
      );

      // Add transaction record for referrer
      await pool.execute(
        'INSERT INTO transactions (user_id, type, amount, status, description) VALUES (?, ?, ?, ?, ?)',
        [referredBy, 'referral_bonus', 100, 'completed', `Referral bonus for ${name}`]
      );

      // Update referrer's total earnings
      await pool.execute(
        'UPDATE users SET total_earning = total_earning + 100 WHERE user_id = ?',
        [referredBy]
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId, email, name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        userId,
        name,
        email,
        phone,
        referralCode: referralCodeFinal
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT user_id, name, email, phone, password_hash, referral_code FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referral_code
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT user_id, name, email, phone, referral_code, account_balance, total_earning, rewards FROM users WHERE user_id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout (client-side token removal)
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
