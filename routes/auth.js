const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { sendEmail } = require('../utils/emailService');
const { sendSMS } = require('../utils/smsService');
const { generateOTP, verifyOTP } = require('../utils/otpService');

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('phone').isMobilePhone(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('dateOfBirth').isISO8601(),
  body('gender').isIn(['male', 'female', 'other']),
  body('address').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('country').trim().notEmpty(),
  body('postalCode').trim().notEmpty(),
  body('referredBy').optional().isUUID()
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

    const {
      email,
      phone,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      country,
      postalCode,
      referredBy
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [User.sequelize.Op.or]: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      phone,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      country,
      postalCode,
      referredBy
    });

    // Create wallet for user
    await Wallet.create({
      userId: user.id,
      balance: 0.00,
      currency: 'USD'
    });

    // Generate verification tokens
    const emailToken = jwt.sign(
      { userId: user.id, type: 'email' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const phoneOTP = generateOTP();
    await verifyOTP(user.phone, phoneOTP);

    // Send verification emails/SMS
    await sendEmail({
      to: user.email,
      subject: 'Welcome to TradePro - Verify Your Email',
      template: 'emailVerification',
      data: {
        name: user.firstName,
        verificationLink: `${process.env.APP_URL}/verify-email?token=${emailToken}`
      }
    });

    await sendSMS({
      to: user.phone,
      message: `Your TradePro verification code is: ${phoneOTP}. Valid for 10 minutes.`
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
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

    const { email, password, twoFactorCode } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email },
      include: [{ model: Wallet, as: 'wallet' }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is blocked
    if (user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is blocked. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked. Please try again later.'
      });
    }

    // Verify 2FA if enabled
    if (user.isTwoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(400).json({
          success: false,
          message: 'Two-factor authentication code required'
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({
          success: false,
          message: 'Invalid two-factor authentication code'
        });
      }
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'email') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isEmailVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Verify phone
router.post('/verify-phone', [
  body('phone').isMobilePhone(),
  body('otp').isLength({ min: 4, max: 6 })
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

    const { phone, otp } = req.body;

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValid = await verifyOTP(phone, otp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    user.isPhoneVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Phone verified successfully'
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Setup 2FA
router.post('/setup-2fa', async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const secret = speakeasy.generateSecret({
      name: `TradePro (${user.email})`
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl
      }
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enable 2FA
router.post('/enable-2fa', [
  body('token').isLength({ min: 6 })
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
    const { token, secret } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }

    user.isTwoFactorEnabled = true;
    user.twoFactorSecret = secret;
    await user.save();

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully'
    });

  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
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

    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await sendEmail({
      to: user.email,
      subject: 'Reset Your TradePro Password',
      template: 'passwordReset',
      data: {
        name: user.firstName,
        resetLink: `${process.env.APP_URL}/reset-password?token=${resetToken}`
      }
    });

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
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

    const { token, password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = password;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

module.exports = router;
