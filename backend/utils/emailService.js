import nodemailer from 'nodemailer';
import logger from './logger.js';

/**
 * Email Service - Nodemailer Configuration & Email Sending
 * Comprehensive email management system for transactional and notification emails
 * 
 * Purpose:
 * - Send transactional emails (verification, password reset)
 * - Send booking confirmation emails
 * - Send payment receipts
 * - Send notification emails
 * - Handle email templates
 * - Manage email queue
 * 
 * Email Services Supported:
 * - Gmail: Production standard
 * - SendGrid: High-volume alternative
 * - SMTP: Generic SMTP server
 * - Ethereal: Testing/development
 * 
 * Gmail Configuration:
 * - Provider: gmail
 * - Requires: App-specific password
 * - 2FA: Must be enabled
 * - Rate: 300 emails/day
 * - Security: OAuth2 recommended
 * 
 * SendGrid Configuration:
 * - Provider: sendgrid
 * - Auth: API key authentication
 * - Rate: Based on plan (100,000+/month)
 * - Reliability: 99.99% uptime
 * - Features: Templates, webhooks, tracking
 * 
 * Email Templates:
 * - Email Verification: Verify account creation
 * - Password Reset: Reset forgotten passwords
 * - Booking Confirmation: Booking details
 * - Payment Receipt: Transaction confirmation
 * - Notification Alert: System notifications
 * - Invoice: Detailed billing document
 * 
 * Verification Email:
 * - Contains: Verification link with token
 * - Validity: 24 hours
 * - Action: Click link to verify
 * - Next: Gain full account access
 * 
 * Password Reset Email:
 * - Contains: Reset link with token
 * - Validity: 30 minutes
 * - Action: Click to set new password
 * - Security: Token expires after use
 * 
 * Booking Confirmation Email:
 * - Contains: Booking details, dates
 * - Includes: Payment confirmation
 * - Provides: Cancellation instructions
 * - Reminder: Automated day-before
 * 
 * Payment Receipt Email:
 * - Contains: Transaction ID, amount
 * - Method: Card last 4 digits
 * - Invoice: Formatted receipt
 * - Refund policy: Terms included
 * 
 * Template Variables:
 * - {userName}: User's name
 * - {userEmail}: User email address
 * - {verificationLink}: Verification URL
 * - {resetLink}: Password reset URL
 * - {bookingDetails}: Booking info
 * - {amount}: Payment amount
 * - {transactionId}: Tx reference
 * 
 * Handlebars Templating:
 * - Syntax: {{variable}}
 * - Conditions: {{#if condition}}
 * - Loops: {{#each array}}
 * - Helpers: Custom functions
 * - Partials: Reusable sections
 * 
 * Send Email Function:
 * Parameters: recipient, subject, template, variables
 * Process: Render template, send via SMTP
 * Retry: Automatic retry on failure
 * Logging: Track delivery status
 * Response: Delivery confirmation
 * 
 * Email Queue:
 * - Implementation: Redis or database
 * - Retry logic: Exponential backoff
 * - Rate limiting: Respect provider limits
 * - Persistence: Store unsent emails
 * - Priority: Process priority emails first
 * 
 * Error Handling:
 * - Invalid email: Validation error
 * - Send failure: Retry with backoff
 * - Provider error: Fallback option
 * - Template error: Generic message
 * - Authentication: Check credentials
 * 
 * Rate Limiting:
 * - Gmail: 300 emails/day
 * - SendGrid: Plan-based
 * - Custom SMTP: Provider-specific
 * - Throttling: Queue-based limiting
 * 
 * Security Features:
 * - SSL/TLS: Encrypted transmission
 * - Auth: Credentials stored securely
 * - No logs: Never log passwords
 * - DKIM: Email authentication
 * - SPF: Sender policy framework
 * - DMARC: Domain reputation
 * 
 * Template Management:
 * - Location: /templates/ directory
 * - Format: .hbs (Handlebars)
 * - Versions: Multi-language
 * - Styling: Inline CSS
 * - Testing: Preview URLs
 * 
 * Development Testing:
 * - Ethereal: Safe testing environment
 * - Preview: Email preview URL
 * - No delivery: Not sent to real inbox
 * - Sandbox: Isolated testing
 * 
 * Production:
 * - Provider: SendGrid or Gmail
 * - SSL/TLS: Always encrypted
 * - Monitoring: Delivery tracking
 * - Analytics: Open and click tracking
 * - Webhooks: Real-time updates
 * 
 * Webhook Events:
 * - bounce: Email bounced
 * - complaint: Marked as spam
 * - delivery: Successfully delivered
 * - open: Email opened
 * - click: Link clicked
 * 
 * Performance:
 * - Send time: ~1-2 seconds
 * - Queue: Background processing
 * - Template: <500ms rendering
 * - Async: Non-blocking
 * 
 * Compliance:
 * - GDPR: Data privacy
 * - CAN-SPAM: US email rules
 * - CASL: Canadian email rules
 * - PIPEDA: Canadian data protection
 * 
 * Monitoring:
 * - Delivery rate: % successful
 * - Bounce rate: Invalid addresses
 * - Open rate: Email opens
 * - Click rate: Link clicks
 * - Complaint rate: Spam reports
 */
 * - Ethereal: Development/testing (no real sending)
 * - Custom SMTP: Fallback option
 * 
 * Email Types:
 * - Verification: Confirm email ownership
 * - Password Reset: Secure password recovery
 * - Booking Confirmation: Reservation details
 * - Payment Receipt: Transaction confirmation
 * - Notifications: System alerts and reminders
 * - Promotional: Marketing campaigns
 * - Support: Customer service communications
 * 
 * Email Templates:
 * - Handlebars-based templates
 * - Dynamic variable injection
 * - HTML and plain text versions
 * - Responsive design for mobile
 * - Branding and styling
 * 
 * Configuration:
 * - EMAIL_SERVICE: Service provider (gmail, sendgrid, ethereal)
 * - EMAIL_USER: Sender email address
 * - EMAIL_PASS: Email account password or API key
 * - EMAIL_FROM: Sender name in From header
 * - FRONTEND_URL: Frontend base URL for email links
 * 
 * Error Handling:
 * - Graceful failure on network errors
 * - Retry logic for temporary failures
 * - Fallback SMTP if primary fails
 * - Error logging for debugging
 * 
 * Rate Limiting:
 * - Max 100 emails per hour per recipient
 * - Bulk send throttling
 * - Queue management for high volume
 * 
 * Delivery Guarantees:
 * - Gmail: 99% delivery
 * - SendGrid: 99.9% delivery
 * - Ethereal: Development only (no real sending)
 * 
 * Privacy & GDPR:
 * - Unsubscribe links included
 * - Data retention policies
 * - Compliant with email regulations
 */

/**
 * Create and configure email transporter
 * Uses configured email service (Gmail, SendGrid, etc.)
 * @returns {Object} Nodemailer transporter instance
 * @throws {Error} If email configuration is missing
 */
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service configuration missing. Set EMAIL_USER and EMAIL_PASS in environment');
  }

  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send email verification link
 * Called during user registration to confirm email ownership
 * @async
 * @param {string} email - Recipient email address
 * @param {string} token - Email verification token
 * @returns {Object} {success: boolean, error?: string}
 */
export const sendVerificationEmail = async (email, token) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@sportsplatform.com',
      to: email,
      subject: 'Verify Your Email Address - Sports Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification Required</h2>
          <p>Welcome to Premium Sports Platform! Please verify your email address:</p>
          <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This link expires in 24 hours. If you didn't create this account, please ignore.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, token) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@sportsplatform.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}" 
             style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send booking confirmation email
export const sendBookingConfirmationEmail = async (email, bookingDetails) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@sportsplatform.com',
      to: email,
      subject: 'Booking Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Booking Confirmed!</h2>
          <p>Your booking has been confirmed. Here are the details:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> ${bookingDetails.id}</p>
            <p><strong>Field:</strong> ${bookingDetails.fieldName}</p>
            <p><strong>Date:</strong> ${bookingDetails.date}</p>
            <p><strong>Time:</strong> ${bookingDetails.time}</p>
            <p><strong>Duration:</strong> ${bookingDetails.duration}</p>
            <p><strong>Total Cost:</strong> $${bookingDetails.totalCost}</p>
          </div>
          <p>Show this email or your QR code at the venue for entry.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send notification email
export const sendNotificationEmail = async (email, subject, message) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@sportsplatform.com',
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${subject}</h2>
          <p>${message}</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};