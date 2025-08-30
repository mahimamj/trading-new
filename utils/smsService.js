const twilio = require('twilio');
const Redis = require('ioredis');

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// Send SMS
const sendSMS = async ({ to, message }) => {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log('SMS sent:', result.sid);
    return result;

  } catch (error) {
    console.error('SMS sending error:', error);
    throw error;
  }
};

// Send bulk SMS
const sendBulkSMS = async (recipients, message) => {
  try {
    const promises = recipients.map(recipient => 
      sendSMS({
        to: recipient.phone,
        message: message.replace('{{name}}', recipient.firstName)
      })
    );

    const results = await Promise.allSettled(promises);
    return results;

  } catch (error) {
    console.error('Bulk SMS error:', error);
    throw error;
  }
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in Redis
const storeOTP = async (phone, otp, expiryMinutes = 10) => {
  try {
    const key = `otp:${phone}`;
    await redis.setex(key, expiryMinutes * 60, otp);
    return true;
  } catch (error) {
    console.error('OTP storage error:', error);
    return false;
  }
};

// Verify OTP
const verifyOTP = async (phone, otp) => {
  try {
    const key = `otp:${phone}`;
    const storedOTP = await redis.get(key);
    
    if (storedOTP && storedOTP === otp) {
      await redis.del(key); // Delete OTP after successful verification
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('OTP verification error:', error);
    return false;
  }
};

// Send OTP via SMS
const sendOTP = async (phone) => {
  try {
    const otp = generateOTP();
    const message = `Your TradePro verification code is: ${otp}. Valid for 10 minutes.`;
    
    await storeOTP(phone, otp, 10);
    await sendSMS({ to: phone, message });
    
    return true;
  } catch (error) {
    console.error('OTP sending error:', error);
    throw error;
  }
};

// Send notification SMS
const sendNotificationSMS = async (user, type, data) => {
  try {
    const messages = {
      transaction: `Hi ${user.firstName}, your transaction of $${data.amount} has been ${data.status}. Transaction ID: ${data.transactionId}`,
      kyc_approved: `Hi ${user.firstName}, your KYC has been approved. You can now use all features of TradePro.`,
      kyc_rejected: `Hi ${user.firstName}, your KYC was not approved. Reason: ${data.reason}. Please update and resubmit.`,
      security_alert: `Hi ${user.firstName}, we detected suspicious activity on your account. Please contact support immediately.`,
      account_update: `Hi ${user.firstName}, your account has been updated successfully.`
    };

    const message = messages[type];
    if (!message) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    await sendSMS({
      to: user.phone,
      message
    });

  } catch (error) {
    console.error('Notification SMS error:', error);
    throw error;
  }
};

// Store user session
const storeSession = async (userId, sessionData, expiryHours = 24) => {
  try {
    const key = `session:${userId}`;
    await redis.setex(key, expiryHours * 3600, JSON.stringify(sessionData));
    return true;
  } catch (error) {
    console.error('Session storage error:', error);
    return false;
  }
};

// Get user session
const getSession = async (userId) => {
  try {
    const key = `session:${userId}`;
    const sessionData = await redis.get(key);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Session retrieval error:', error);
    return null;
  }
};

// Delete user session
const deleteSession = async (userId) => {
  try {
    const key = `session:${userId}`;
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Session deletion error:', error);
    return false;
  }
};

// Rate limiting
const checkRateLimit = async (key, limit, windowSeconds) => {
  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    return current <= limit;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow if Redis is down
  }
};

module.exports = {
  sendSMS,
  sendBulkSMS,
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTP,
  sendNotificationSMS,
  storeSession,
  getSession,
  deleteSession,
  checkRateLimit
};
