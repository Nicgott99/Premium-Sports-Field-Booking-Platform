/**
 * Email template generator for various notifications
 */

export const emailTemplates = {
  welcome: (user) => ({
    subject: 'Welcome to Sports Field Booking Platform',
    html: `
      <h1>Welcome, ${user.firstName}!</h1>
      <p>Thank you for joining our platform.</p>
      <p>Start booking sports fields now and enjoy amazing experiences!</p>
    `,
  }),

  confirmEmail: (user, confirmLink) => ({
    subject: 'Confirm Your Email Address',
    html: `
      <h1>Email Confirmation</h1>
      <p>Hi ${user.firstName},</p>
      <p>Please confirm your email address to activate your account.</p>
      <a href="${confirmLink}">Confirm Email</a>
    `,
  }),

  passwordReset: (user, resetLink) => ({
    subject: 'Reset Your Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${user.firstName},</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `,
  }),

  bookingConfirmation: (user, booking) => ({
    subject: `Booking Confirmation: ${booking.field?.name}`,
    html: `
      <h1>Booking Confirmed!</h1>
      <p>Hi ${user.firstName},</p>
      <p><strong>Field:</strong> ${booking.field?.name}</p>
      <p><strong>Date:</strong> ${new Date(booking.startTime).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${new Date(booking.startTime).toLocaleTimeString()}</p>
      <p><strong>Amount:</strong> ৳${booking.pricing?.totalAmount}</p>
    `,
  }),

  bookingCancelled: (user, booking) => ({
    subject: `Booking Cancelled: ${booking.field?.name}`,
    html: `
      <h1>Booking Cancelled</h1>
      <p>Hi ${user.firstName},</p>
      <p>Your booking for ${booking.field?.name} has been cancelled.</p>
      <p>A refund of ৳${booking.pricing?.totalAmount} will be processed.</p>
    `,
  }),

  paymentConfirmation: (user, payment) => ({
    subject: `Payment Confirmation: ৳${payment.amount}`,
    html: `
      <h1>Payment Received</h1>
      <p>Hi ${user.firstName},</p>
      <p>We've received your payment of ৳${payment.amount}</p>
      <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
      <p><strong>Date:</strong> ${new Date(payment.date).toLocaleDateString()}</p>
    `,
  }),

  subscriptionUpgrade: (user, plan) => ({
    subject: `Welcome to ${plan.name} Plan`,
    html: `
      <h1>Subscription Upgraded!</h1>
      <p>Hi ${user.firstName},</p>
      <p>Your subscription has been upgraded to ${plan.name}.</p>
      <p><strong>Benefits:</strong></p>
      <ul>
        <li>${plan.benefits?.join('</li><li>')}</li>
      </ul>
    `,
  }),

  subscriptionCancelled: (user) => ({
    subject: 'Subscription Cancelled',
    html: `
      <h1>Subscription Cancelled</h1>
      <p>Hi ${user.firstName},</p>
      <p>Your subscription has been cancelled.</p>
      <p>You can reactivate it anytime from your account settings.</p>
    `,
  }),

  reviewRequest: (user, field) => ({
    subject: `Share Your Experience at ${field.name}`,
    html: `
      <h1>Review Request</h1>
      <p>Hi ${user.firstName},</p>
      <p>We'd love to hear about your experience at ${field.name}!</p>
      <p><a href="#">Write a Review</a></p>
    `,
  }),

  notificationAlert: (user, notification) => ({
    subject: notification.title,
    html: `
      <h1>${notification.title}</h1>
      <p>Hi ${user.firstName},</p>
      <p>${notification.message}</p>
    `,
  }),

  bulkEmail: (subject, content) => ({
    subject,
    html: content,
  }),
};

/**
 * Generate email from template
 * @param {string} templateName - Template name
 * @param {object} data - Template data
 * @returns {object} Email object
 */
export const generateEmail = (templateName, data) => {
  const template = emailTemplates[templateName];
  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }
  return template(data);
};

/**
 * Generate custom HTML email
 * @param {string} subject - Email subject
 * @param {string} heading - Email heading
 * @param {string} content - Email content
 * @param {string} buttonText - Button text
 * @param {string} buttonLink - Button link
 * @returns {object} Email object
 */
export const generateCustomEmail = (subject, heading, content, buttonText = null, buttonLink = null) => {
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0;">${heading}</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <p>${content}</p>
  `;

  if (buttonText && buttonLink) {
    html += `
      <div style="text-align: center; margin-top: 30px;">
        <a href="${buttonLink}" style="background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          ${buttonText}
        </a>
      </div>
    `;
  }

  html += `
      </div>
      <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>© 2026 Sports Field Booking Platform. All rights reserved.</p>
      </div>
    </div>
  `;

  return { subject, html };
};

/**
 * Get email template names
 * @returns {array} Available template names
 */
export const getAvailableTemplates = () => {
  return Object.keys(emailTemplates);
};

export default {
  emailTemplates,
  generateEmail,
  generateCustomEmail,
  getAvailableTemplates,
};
