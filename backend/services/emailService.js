const nodemailer = require('nodemailer');

const createTransport = () => {
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port:   Number(process.env.EMAIL_PORT ?? 587),
      secure: process.env.EMAIL_SECURE === 'true',
      auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  return nodemailer.createTransport({ jsonTransport: true });
};

const FROM = `"SportsField BD" <${process.env.EMAIL_FROM ?? 'noreply@sportsfield.bd'}>`;

const TEMPLATES = {
  bookingConfirmed: (d) => ({
    subject: `✅ Booking Confirmed — ${d.fieldName}`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#7c3aed,#ec4899);padding:24px 32px">
        <h1 style="margin:0;font-size:22px;color:#fff">Booking Confirmed!</h1>
      </div>
      <div style="padding:24px 32px">
        <p>Hi <strong>${d.userName}</strong>, your booking is confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#94a3b8">Field</td><td style="padding:8px;color:#f1f5f9;font-weight:700">${d.fieldName}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8">Date</td><td style="padding:8px;color:#f1f5f9">${d.date}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8">Time</td><td style="padding:8px;color:#f1f5f9">${d.startTime} – ${d.endTime}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8">Amount</td><td style="padding:8px;color:#f59e0b;font-weight:700">৳${d.amount}</td></tr>
        </table>
        <a href="${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/bookings" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">View Booking</a>
      </div>
      <div style="padding:16px 32px;border-top:1px solid #1e293b;color:#475569;font-size:12px">SportsField BD · Dhaka, Bangladesh</div>
    </div>`,
  }),

  bookingReminder: (d) => ({
    subject: `⏰ Reminder: Your booking at ${d.fieldName} is tomorrow`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:24px 32px">
        <h1 style="margin:0;font-size:22px;color:#fff">Booking Reminder</h1>
      </div>
      <div style="padding:24px 32px">
        <p>Hi <strong>${d.userName}</strong>, just a reminder about your upcoming session!</p>
        <p style="background:#1e293b;padding:16px;border-radius:8px;color:#f59e0b;font-weight:700">${d.fieldName} · ${d.date} · ${d.startTime}</p>
        <p style="color:#94a3b8;font-size:14px">Please arrive 10 minutes early. Bring your gear!</p>
      </div>
    </div>`,
  }),

  welcome: (d) => ({
    subject: `🎉 Welcome to SportsField BD, ${d.userName}!`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#10b981,#7c3aed);padding:24px 32px">
        <h1 style="margin:0;font-size:22px;color:#fff">Welcome aboard!</h1>
      </div>
      <div style="padding:24px 32px">
        <p>Hi <strong>${d.userName}</strong>, you're all set to book premium sports fields.</p>
        <a href="${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/fields" style="display:inline-block;background:linear-gradient(135deg,#10b981,#7c3aed);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Explore Fields →</a>
      </div>
    </div>`,
  }),

  passwordReset: (d) => ({
    subject: '🔐 Reset your SportsField BD password',
    html: `<div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden">
      <div style="padding:24px 32px">
        <h2>Password Reset</h2>
        <p>Click below to reset your password. This link expires in 1 hour.</p>
        <a href="${d.resetUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Reset Password</a>
        <p style="color:#64748b;font-size:12px;margin-top:16px">If you didn't request this, ignore this email.</p>
      </div>
    </div>`,
  }),
};

const send = async (to, templateName, data) => {
  const transport = createTransport();
  const template  = TEMPLATES[templateName];
  if (!template) throw new Error(`Unknown email template: ${templateName}`);
  const { subject, html } = template(data);
  const info = await transport.sendMail({ from: FROM, to, subject, html });
  return { messageId: info.messageId, accepted: info.accepted ?? [to] };
};

module.exports = { send, TEMPLATES };
