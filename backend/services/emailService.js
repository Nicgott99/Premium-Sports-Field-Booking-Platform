import nodemailer from 'nodemailer';
import logger from './logger.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    const result = await transporter.sendMail({
      from: `"CSE471 Sports" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
    return result;
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    throw err;
  }
};

export const sendWelcomeEmail = (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to CSE471 Sports, ${name}!</h2>
      <p>Thank you for joining our premium sports booking platform.</p>
      <p>You can now:</p>
      <ul>
        <li>Browse and book sports fields</li>
        <li>Join tournaments and teams</li>
        <li>Track your bookings and stats</li>
      </ul>
      <p><a href="https://sports.example.com/login" style="background: #FBBF24; padding: 10px 20px; text-decoration: none; color: #111; border-radius: 5px;">Get Started</a></p>
    </div>
  `;
  return sendEmail(email, 'Welcome to CSE471 Sports!', html);
};

export const sendBookingConfirmation = (email, bookingDetails) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Confirmed!</h2>
      <p>Your booking has been confirmed.</p>
      <ul>
        <li><strong>Field:</strong> ${bookingDetails.fieldName}</li>
        <li><strong>Date:</strong> ${bookingDetails.date}</li>
        <li><strong>Time:</strong> ${bookingDetails.time}</li>
        <li><strong>Amount:</strong> ৳${bookingDetails.amount}</li>
      </ul>
      <p>See you soon!</p>
    </div>
  `;
  return sendEmail(email, 'Booking Confirmed', html);
};

export const sendPasswordReset = (email, resetLink) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetLink}" style="background: #FBBF24; padding: 10px 20px; text-decoration: none; color: #111; border-radius: 5px;">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
    </div>
  `;
  return sendEmail(email, 'Password Reset', html);
};

export const sendCancellationEmail = (email, bookingDetails) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Cancelled</h2>
      <p>Your booking has been cancelled.</p>
      <p><strong>Field:</strong> ${bookingDetails.fieldName}</p>
      <p><strong>Refund:</strong> ৳${bookingDetails.refundAmount}</p>
      <p>Your refund has been processed.</p>
    </div>
  `;
  return sendEmail(email, 'Booking Cancelled', html);
};
