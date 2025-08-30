const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email templates
const emailTemplates = {
  emailVerification: {
    subject: 'Verify Your Email - TradePro',
    template: 'emailVerification.html'
  },
  passwordReset: {
    subject: 'Reset Your Password - TradePro',
    template: 'passwordReset.html'
  },
  transactionNotification: {
    subject: 'Transaction Notification - TradePro',
    template: 'transactionNotification.html'
  },
  kycApproved: {
    subject: 'KYC Approved - TradePro',
    template: 'kycApproved.html'
  },
  kycRejected: {
    subject: 'KYC Update - TradePro',
    template: 'kycRejected.html'
  },
  welcome: {
    subject: 'Welcome to TradePro',
    template: 'welcome.html'
  }
};

// Load email template
async function loadTemplate(templateName, data) {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', templateName);
    let template = await fs.readFile(templatePath, 'utf8');
    
    // Replace placeholders with data
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, data[key]);
    });
    
    return template;
  } catch (error) {
    console.error('Template loading error:', error);
    return null;
  }
}

// Send email
const sendEmail = async ({ to, subject, template, data, html, text }) => {
  try {
    let emailContent = '';
    
    if (template) {
      const templateConfig = emailTemplates[template];
      if (templateConfig) {
        emailContent = await loadTemplate(templateConfig.template, data);
        subject = templateConfig.subject;
      }
    } else if (html) {
      emailContent = html;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: emailContent,
      text: text || emailContent.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;

  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// Send bulk email
const sendBulkEmail = async (recipients, subject, template, data) => {
  try {
    const promises = recipients.map(recipient => 
      sendEmail({
        to: recipient.email,
        subject,
        template,
        data: { ...data, name: recipient.name }
      })
    );

    const results = await Promise.allSettled(promises);
    return results;

  } catch (error) {
    console.error('Bulk email error:', error);
    throw error;
  }
};

// Send notification email
const sendNotificationEmail = async (user, type, data) => {
  try {
    const templates = {
      transaction: 'transactionNotification',
      kyc_approved: 'kycApproved',
      kyc_rejected: 'kycRejected',
      security_alert: 'securityAlert',
      account_update: 'accountUpdate'
    };

    const template = templates[type];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    await sendEmail({
      to: user.email,
      template,
      data: {
        name: user.firstName,
        ...data
      }
    });

  } catch (error) {
    console.error('Notification email error:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  sendNotificationEmail
};
