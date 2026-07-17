/**
 * notificationTemplates.js
 * Reusable notification/email message templates.
 * Premium Sports Field Booking Platform
 *
 * Returns structured objects {subject, text, html} consumed by the
 * email service, push notification service, or in-app notification system.
 * Centralising templates here means copy changes only need one edit.
 */

const APP_NAME   = 'Premium Sports Platform';
const SUPPORT    = 'support@premiumsports.com';

/**
 * @typedef {{ subject: string, text: string, html: string }} NotificationTemplate
 */

/**
 * Booking confirmation notification.
 * @param {object} params
 * @param {string} params.userName
 * @param {string} params.fieldName
 * @param {string} params.date         - Human-readable date string
 * @param {string} params.startTime    - e.g. "5:00 PM"
 * @param {string} params.endTime      - e.g. "6:00 PM"
 * @param {string} params.reference    - Booking reference code
 * @param {number} params.total
 * @param {string} params.currency
 * @returns {NotificationTemplate}
 */
export const bookingConfirmation = ({ userName, fieldName, date, startTime, endTime, reference, total, currency = 'BDT' }) => ({
  subject: `Booking Confirmed ✅ — ${reference}`,
  text:
    `Hi ${userName},\n\nYour booking is confirmed!\n\n` +
    `Field: ${fieldName}\nDate: ${date}\nTime: ${startTime} – ${endTime}\n` +
    `Reference: ${reference}\nTotal Paid: ${currency} ${total}\n\n` +
    `Need help? Reply to this email or contact ${SUPPORT}.\n\n— ${APP_NAME}`,
  html:
    `<p>Hi <strong>${userName}</strong>,</p>` +
    `<p>Your booking is <strong>confirmed</strong>! 🎉</p>` +
    `<table><tbody>` +
    `<tr><td><strong>Field</strong></td><td>${fieldName}</td></tr>` +
    `<tr><td><strong>Date</strong></td><td>${date}</td></tr>` +
    `<tr><td><strong>Time</strong></td><td>${startTime} – ${endTime}</td></tr>` +
    `<tr><td><strong>Reference</strong></td><td>${reference}</td></tr>` +
    `<tr><td><strong>Total Paid</strong></td><td>${currency} ${total}</td></tr>` +
    `</tbody></table>` +
    `<p>Need help? Contact us at <a href="mailto:${SUPPORT}">${SUPPORT}</a>.</p>`,
});

/**
 * Booking cancellation notification.
 * @param {object} params
 * @param {string} params.userName
 * @param {string} params.reference
 * @param {number} params.refundAmount
 * @param {string} params.currency
 * @returns {NotificationTemplate}
 */
export const bookingCancellation = ({ userName, reference, refundAmount, currency = 'BDT' }) => ({
  subject: `Booking Cancelled — ${reference}`,
  text:
    `Hi ${userName},\n\nYour booking ${reference} has been cancelled.\n` +
    `Refund: ${currency} ${refundAmount}\n\n` +
    `Refunds are processed within 3–5 business days.\n\n— ${APP_NAME}`,
  html:
    `<p>Hi <strong>${userName}</strong>,</p>` +
    `<p>Your booking <strong>${reference}</strong> has been cancelled.</p>` +
    `<p>Refund amount: <strong>${currency} ${refundAmount}</strong></p>` +
    `<p>Refunds are processed within 3–5 business days.</p>`,
});

/**
 * Booking reminder notification (sent N hours before the slot).
 * @param {object} params
 * @param {string} params.userName
 * @param {string} params.fieldName
 * @param {string} params.date
 * @param {string} params.startTime
 * @param {string} params.reference
 * @returns {NotificationTemplate}
 */
export const bookingReminder = ({ userName, fieldName, date, startTime, reference }) => ({
  subject: `⏰ Reminder: Your booking starts soon — ${reference}`,
  text:
    `Hi ${userName},\n\nJust a reminder that your booking at ${fieldName} ` +
    `is coming up on ${date} at ${startTime}.\n\nReference: ${reference}\n\n— ${APP_NAME}`,
  html:
    `<p>Hi <strong>${userName}</strong>,</p>` +
    `<p>Your booking at <strong>${fieldName}</strong> is coming up!</p>` +
    `<p><strong>Date:</strong> ${date}<br/><strong>Time:</strong> ${startTime}</p>` +
    `<p>Reference: ${reference}</p>`,
});

/**
 * OTP / verification code notification.
 * @param {object} params
 * @param {string} params.userName
 * @param {string} params.otp
 * @param {number} [params.expiresInMinutes=5]
 * @returns {NotificationTemplate}
 */
export const otpVerification = ({ userName, otp, expiresInMinutes = 5 }) => ({
  subject: `Your ${APP_NAME} verification code`,
  text:
    `Hi ${userName},\n\nYour verification code is: ${otp}\n` +
    `This code expires in ${expiresInMinutes} minutes. Do not share it with anyone.\n\n— ${APP_NAME}`,
  html:
    `<p>Hi <strong>${userName}</strong>,</p>` +
    `<p>Your verification code is:</p>` +
    `<h1 style="letter-spacing:0.3em;font-size:2rem;color:#f59e0b;">${otp}</h1>` +
    `<p>This code expires in <strong>${expiresInMinutes} minutes</strong>. Do not share it with anyone.</p>`,
});

export default { bookingConfirmation, bookingCancellation, bookingReminder, otpVerification };
