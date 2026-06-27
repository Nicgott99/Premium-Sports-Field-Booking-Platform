/**
 * passwordGenerator.js
 * Utility to generate secure, random passwords.
 * Premium Sports Field Booking Platform
 */

import crypto from 'crypto';

/**
 * Generate a strong random password.
 * @param {number} length - Length of the password to generate.
 * @param {object} options - Options for characters to include.
 * @param {boolean} [options.includeUppercase=true] - Include uppercase letters.
 * @param {boolean} [options.includeLowercase=true] - Include lowercase letters.
 * @param {boolean} [options.includeNumbers=true] - Include numbers.
 * @param {boolean} [options.includeSymbols=true] - Include symbols.
 * @returns {string} The generated password.
 */
export const generatePassword = (length = 12, options = {}) => {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

  let allowedChars = '';
  if (includeUppercase) allowedChars += uppercaseChars;
  if (includeLowercase) allowedChars += lowercaseChars;
  if (includeNumbers) allowedChars += numberChars;
  if (includeSymbols) allowedChars += symbolChars;

  if (!allowedChars) {
    throw new Error('At least one character type must be selected to generate a password.');
  }

  let password = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % allowedChars.length;
    password += allowedChars[randomIndex];
  }

  // Ensure at least one character of each selected type is included
  let finalPassword = password.split('');
  let i = 0;

  if (includeUppercase) finalPassword[i++] = uppercaseChars[crypto.randomBytes(1)[0] % uppercaseChars.length];
  if (includeLowercase) finalPassword[i++] = lowercaseChars[crypto.randomBytes(1)[0] % lowercaseChars.length];
  if (includeNumbers) finalPassword[i++] = numberChars[crypto.randomBytes(1)[0] % numberChars.length];
  if (includeSymbols) finalPassword[i++] = symbolChars[crypto.randomBytes(1)[0] % symbolChars.length];

  // Shuffle the final password to distribute the guaranteed characters
  for (let j = finalPassword.length - 1; j > 0; j--) {
    const k = crypto.randomBytes(1)[0] % (j + 1);
    [finalPassword[j], finalPassword[k]] = [finalPassword[k], finalPassword[j]];
  }

  return finalPassword.join('');
};

export default { generatePassword };
