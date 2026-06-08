import crypto from 'crypto';

/**
 * Encryption and decryption utilities
 */

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Hash string using bcrypt-like method
 * @param {string} text - Text to hash
 * @returns {string} Hashed text
 */
export const hashString = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Generate random token
 * @param {number} length - Token length
 * @returns {string} Random token
 */
export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate API key
 * @returns {string} API key
 */
export const generateApiKey = () => {
  return `api_${generateToken(32)}`;
};

/**
 * Encrypt sensitive data
 * @param {string} text - Text to encrypt
 * @param {string} encryptionKey - Encryption key
 * @returns {string} Encrypted text (iv:encrypted:tag)
 */
export const encrypt = (text, encryptionKey) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(encryptionKey.padEnd(32).slice(0, 32)), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
};

/**
 * Decrypt sensitive data
 * @param {string} encrypted - Encrypted text (iv:encrypted:tag)
 * @param {string} encryptionKey - Encryption key
 * @returns {string} Decrypted text
 */
export const decrypt = (encrypted, encryptionKey) => {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = parts[1];
  const tag = Buffer.from(parts[2], 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(encryptionKey.padEnd(32).slice(0, 32)), iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Generate OTP (One Time Password)
 * @param {number} length - OTP length
 * @returns {string} OTP
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Create HMAC signature
 * @param {string} message - Message to sign
 * @param {string} secret - Secret key
 * @returns {string} Signature
 */
export const createSignature = (message, secret) => {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
};

/**
 * Verify HMAC signature
 * @param {string} message - Original message
 * @param {string} signature - Signature to verify
 * @param {string} secret - Secret key
 * @returns {boolean} Is valid
 */
export const verifySignature = (message, signature, secret) => {
  const expected = createSignature(message, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};

/**
 * Hash password (simulated)
 * @param {string} password - Password to hash
 * @param {string} salt - Salt
 * @returns {string} Hashed password
 */
export const hashPassword = (password, salt = generateToken(8)) => {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}$${hash}`;
};

/**
 * Verify password
 * @param {string} password - Password to verify
 * @param {string} hash - Hashed password (salt$hash)
 * @returns {boolean} Is valid
 */
export const verifyPassword = (password, hash) => {
  const [salt, originalHash] = hash.split('$');
  const newHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(newHash), Buffer.from(originalHash));
};

/**
 * Encrypt object
 * @param {object} obj - Object to encrypt
 * @param {string} encryptionKey - Encryption key
 * @returns {string} Encrypted JSON
 */
export const encryptObject = (obj, encryptionKey) => {
  const json = JSON.stringify(obj);
  return encrypt(json, encryptionKey);
};

/**
 * Decrypt object
 * @param {string} encrypted - Encrypted data
 * @param {string} encryptionKey - Encryption key
 * @returns {object} Decrypted object
 */
export const decryptObject = (encrypted, encryptionKey) => {
  const json = decrypt(encrypted, encryptionKey);
  return JSON.parse(json);
};

export default {
  hashString,
  generateToken,
  generateApiKey,
  encrypt,
  decrypt,
  generateOTP,
  createSignature,
  verifySignature,
  hashPassword,
  verifyPassword,
  encryptObject,
  decryptObject,
};
