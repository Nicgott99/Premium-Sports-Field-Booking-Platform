import nodemailer from 'nodemailer';
import logger from './logger.js';

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