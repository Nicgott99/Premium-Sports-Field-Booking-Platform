import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

// Create email transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email service (Gmail, SendGrid, etc.)
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development - use Ethereal Email
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: process.env.EMAIL_PORT || 587,
      auth: {
        user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.EMAIL_PASS || 'ethereal.pass'
      }
    });
  }
};

// Email templates
const emailTemplates = {
  emailVerification: {
    subject: 'Welcome to Premium MERN Sports Platform - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Premium Sports Platform!</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #333;">Hi {{name}},</p>
          <p style="font-size: 16px; color: #666; line-height: 1.6;">
            Thank you for joining our premium sports booking platform! To complete your registration and start booking amazing sports facilities, please verify your email address.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{verificationURL}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 14px; color: #999; text-align: center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{verificationURL}}" style="color: #667eea;">{{verificationURL}}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 14px; color: #999; text-align: center;">
            This verification link will expire in 24 hours.<br>
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      </div>
    `
  },
  
  passwordReset: {
    subject: 'Premium MERN Sports Platform - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #333;">Hi {{name}},</p>
          <p style="font-size: 16px; color: #666; line-height: 1.6;">
            We received a request to reset your password for your Premium Sports Platform account. Click the button below to reset your password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetURL}}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="font-size: 14px; color: #999; text-align: center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{resetURL}}" style="color: #f5576c;">{{resetURL}}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 14px; color: #999; text-align: center;">
            This password reset link will expire in {{expiryTime}}.<br>
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      </div>
    `
  },

  bookingConfirmation: {
    subject: 'Booking Confirmed - Premium MERN Sports Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Booking Confirmed!</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #333;">Hi {{name}},</p>
          <p style="font-size: 16px; color: #666; line-height: 1.6;">
            Great news! Your booking has been confirmed. Here are your booking details:
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #4facfe; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Booking Details</h3>
            <p style="margin: 5px 0;"><strong>Booking ID:</strong> {{bookingId}}</p>
            <p style="margin: 5px 0;"><strong>Field:</strong> {{fieldName}}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> {{date}}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> {{startTime}} - {{endTime}}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> {{duration}} minutes</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> {{totalAmount}} {{currency}}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <img src="{{qrCode}}" alt="QR Code" style="max-width: 200px; border: 1px solid #ddd; padding: 10px;">
            <p style="font-size: 14px; color: #666;">Show this QR code at the venue for check-in</p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 14px; color: #999; text-align: center;">
            Need help? Contact us at support@sportsplatform.com<br>
            Download our mobile app for easy check-in and management.
          </p>
        </div>
      </div>
    `
  },

  bookingReminder: {
    subject: 'Booking Reminder - Your session starts soon!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🏃‍♂️ Get Ready to Play!</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; color: #333;">Hi {{name}},</p>
          <p style="font-size: 16px; color: #666; line-height: 1.6;">
            Your booking starts in {{timeUntil}}! Don't forget to bring your gear and arrive 15 minutes early.
          </p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">Quick Reminder</h3>
            <p style="margin: 5px 0; color: #856404;"><strong>Field:</strong> {{fieldName}}</p>
            <p style="margin: 5px 0; color: #856404;"><strong>Time:</strong> {{startTime}} - {{endTime}}</p>
            <p style="margin: 5px 0; color: #856404;"><strong>Address:</strong> {{address}}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{checkInURL}}" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Quick Check-In
            </a>
          </div>
        </div>
      </div>
    `
  }
};

// Compile template with data
const compileTemplate = (templateName, data) => {
  const template = emailTemplates[templateName];
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  const compiledSubject = handlebars.compile(template.subject)(data);
  const compiledHtml = handlebars.compile(template.html)(data);

  return {
    subject: compiledSubject,
    html: compiledHtml
  };
};

// Send email function
export const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    let emailContent;
    
    if (options.template) {
      // Use template
      emailContent = compileTemplate(options.template, options.data || {});
    } else {
      // Use direct content
      emailContent = {
        subject: options.subject,
        html: options.html || options.text
      };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Premium Sports Platform <noreply@sportsplatform.com>',
      to: options.to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    // Add attachments if provided
    if (options.attachments) {
      mailOptions.attachments = options.attachments;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log('📧 Email sent successfully:', {
      to: options.to,
      subject: emailContent.subject,
      messageId: info.messageId
    });

    // Log preview URL in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null
    };

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Send bulk emails
export const sendBulkEmails = async (emails) => {
  const results = [];
  
  for (const emailOptions of emails) {
    try {
      const result = await sendEmail(emailOptions);
      results.push({ success: true, to: emailOptions.to, result });
    } catch (error) {
      results.push({ success: false, to: emailOptions.to, error: error.message });
    }
  }
  
  return results;
};

// Email queue (for background processing)
export class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  add(emailOptions) {
    this.queue.push({
      ...emailOptions,
      id: Date.now() + Math.random(),
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date()
    });

    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    this.processing = true;

    while (this.queue.length > 0) {
      const emailJob = this.queue.shift();

      try {
        await sendEmail(emailJob);
        console.log(`✅ Email sent successfully: ${emailJob.id}`);
      } catch (error) {
        emailJob.attempts++;
        console.error(`❌ Email failed (attempt ${emailJob.attempts}): ${emailJob.id}`, error.message);

        if (emailJob.attempts < emailJob.maxAttempts) {
          // Retry after delay
          setTimeout(() => {
            this.queue.push(emailJob);
          }, 5000 * emailJob.attempts); // Exponential backoff
        } else {
          console.error(`❌ Email permanently failed after ${emailJob.maxAttempts} attempts: ${emailJob.id}`);
        }
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
  }
}

// Create global email queue instance
export const emailQueue = new EmailQueue();

// Helper functions
export const sendWelcomeEmail = (user) => {
  return sendEmail({
    to: user.email,
    template: 'emailVerification',
    data: {
      name: user.firstName,
      verificationURL: `${process.env.CLIENT_URL}/auth/verify-email/${user.emailVerificationToken}`
    }
  });
};

export const sendBookingConfirmation = (user, booking) => {
  return sendEmail({
    to: user.email,
    template: 'bookingConfirmation',
    data: {
      name: user.firstName,
      bookingId: booking.bookingId,
      fieldName: booking.field.name,
      date: booking.bookingDate.toLocaleDateString(),
      startTime: booking.timeSlot.startTime,
      endTime: booking.timeSlot.endTime,
      duration: booking.duration,
      totalAmount: booking.pricing.totalAmount,
      currency: booking.pricing.currency,
      qrCode: booking.qrCode.image
    }
  });
};

export const sendBookingReminder = (user, booking) => {
  return sendEmail({
    to: user.email,
    template: 'bookingReminder',
    data: {
      name: user.firstName,
      fieldName: booking.field.name,
      startTime: booking.timeSlot.startTime,
      endTime: booking.timeSlot.endTime,
      address: booking.field.location.address.street,
      timeUntil: '2 hours', // This would be calculated
      checkInURL: `${process.env.CLIENT_URL}/booking/${booking.bookingId}/checkin`
    }
  });
};