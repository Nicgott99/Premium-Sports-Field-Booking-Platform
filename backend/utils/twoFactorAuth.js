/**
 * twoFactorAuth.js
 * Time-based One-Time Password (TOTP) helper utilities.
 * Premium Sports Field Booking Platform
 *
 * Generates and verifies 6-digit TOTP codes for two-factor authentication
 * using the HOTP/TOTP standard (RFC 6238). Requires the `otplib` package.
 *
 * Usage:
 *   import { generateTotpSecret, generateQrUri, verifyTotp } from '../utils/twoFactorAuth.js';
 *
 *   // On enable 2FA:
 *   const { secret, qrUri } = await generateTotpSecret(user.email);
 *   // Store secret (encrypted) on user document, show qrUri to user.
 *
 *   // On verify:
 *   const ok = verifyTotp(userInputCode, user.totpSecret);
 */

import { authenticator } from 'otplib';
import qrcode from 'qrcode';

const APP_NAME = 'Premium Sports Platform';

/**
 * Generate a new TOTP secret and QR code data-URI for a user.
 *
 * @param {string} userIdentifier - Email or username shown in the authenticator app.
 * @returns {Promise<{ secret: string, qrUri: string, manualEntryKey: string }>}
 */
export const generateTotpSecret = async (userIdentifier) => {
  const secret = authenticator.generateSecret();

  const otpAuthUri = authenticator.keyuri(userIdentifier, APP_NAME, secret);

  // Render as a base64 PNG data-URI so it can be embedded in the response
  const qrUri = await qrcode.toDataURL(otpAuthUri);

  return {
    secret,
    qrUri,
    // Human-readable key users can type manually if QR scanner fails
    manualEntryKey: secret.match(/.{1,4}/g).join(' '),
  };
};

/**
 * Verify a 6-digit TOTP token against a stored secret.
 * Accepts one step of clock drift (±30 s) for usability.
 *
 * @param {string} token  - 6-digit code from the authenticator app.
 * @param {string} secret - Stored TOTP secret for this user.
 * @returns {boolean}
 */
export const verifyTotp = (token, secret) => {
  try {
    authenticator.options = { window: 1 }; // allow ±1 time-step (±30 s)
    return authenticator.verify({ token: String(token).trim(), secret });
  } catch {
    return false;
  }
};

export default { generateTotpSecret, verifyTotp };
