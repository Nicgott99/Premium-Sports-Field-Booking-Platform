const https = require('https');

const PROVIDERS = {
  twilio: {
    send: async ({ to, body }) => {
      const sid    = process.env.TWILIO_ACCOUNT_SID;
      const token  = process.env.TWILIO_AUTH_TOKEN;
      const from   = process.env.TWILIO_FROM_NUMBER;
      if (!sid || !token || !from) throw new Error('Twilio credentials not configured');

      const params = new URLSearchParams({ To: to, From: from, Body: body }).toString();
      return httpPost(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, params, {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      });
    },
  },
  console: {
    send: async ({ to, body }) => {
      console.log(`[SMS] To: ${to} | ${body}`);
      return { sid: `mock_${Date.now()}`, status: 'sent' };
    },
  },
};

const httpPost = (url, body, headers) => new Promise((resolve, reject) => {
  const parsed  = new URL(url);
  const options = { hostname: parsed.hostname, path: parsed.pathname, method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(body) } };
  const req = https.request(options, (res) => {
    let raw = '';
    res.on('data', chunk => { raw += chunk; });
    res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
  });
  req.on('error', reject);
  req.write(body);
  req.end();
});

const MESSAGES = {
  bookingConfirmed: (d) => `SportsField BD: Booking confirmed! ${d.fieldName} on ${d.date} at ${d.startTime}. Booking ID: ${d.bookingId}`,
  bookingReminder:  (d) => `SportsField BD: Reminder! Your booking at ${d.fieldName} is tomorrow at ${d.startTime}. See you there!`,
  bookingCancelled: (d) => `SportsField BD: Your booking at ${d.fieldName} on ${d.date} has been cancelled. Refund will be processed within 3-5 days.`,
  otpCode:          (d) => `SportsField BD: Your OTP is ${d.otp}. Valid for 10 minutes. Do not share with anyone.`,
  paymentSuccess:   (d) => `SportsField BD: Payment of ৳${d.amount} received for booking at ${d.fieldName}. Thank you!`,
};

const getProvider = () => {
  const name = process.env.SMS_PROVIDER ?? 'console';
  return PROVIDERS[name] ?? PROVIDERS.console;
};

const send = async (to, templateName, data) => {
  const template = MESSAGES[templateName];
  if (!template) throw new Error(`Unknown SMS template: ${templateName}`);
  const body     = template(data);
  const provider = getProvider();
  return provider.send({ to, body });
};

const sendRaw = async (to, body) => getProvider().send({ to, body });

module.exports = { send, sendRaw, MESSAGES };
