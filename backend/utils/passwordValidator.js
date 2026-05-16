/**
 * Password Validation Utility
 * Comprehensive password strength checking and validation
 * Enforces security best practices for user passwords
 */

/**
 * Password strength levels
 */
export const PASSWORD_STRENGTH = {
  WEAK: 'weak',
  FAIR: 'fair',
  GOOD: 'good',
  STRONG: 'strong',
  VERY_STRONG: 'very_strong'
};

/**
 * Validate password against comprehensive security requirements
 * Requirements:
 * - Minimum 10 characters (security best practice)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - No common patterns (e.g., 'password', '12345', 'qwerty')
 * - Not similar to email or username
 * 
 * @param {string} password - Password to validate
 * @param {string} email - User email for similarity check
 * @param {string} username - User username for similarity check
 * @returns {Object} Validation result with strength level and feedback
 */
export const validatePassword = (password, email = '', username = '') => {
  const result = createValidationResult();

  if (!password) {
    result.feedback.push('Password is required');
    return result;
  }

  evaluateLength(password, result);
  evaluateCharacterClasses(password, result);
  evaluatePatternRules(password, email, username, result);
  evaluateStrength(result);
  result.isValid = result.feedback.length === 0;

  return result;
};

const createValidationResult = () => ({
  isValid: false,
  strength: PASSWORD_STRENGTH.WEAK,
  feedback: [],
  score: 0
});

const evaluateLength = (password, result) => {
  if (password.length < 10) {
    result.feedback.push('Password must be at least 10 characters long');
    return;
  }

  result.score += password.length < 12 ? 1 : 2;
};

const evaluateCharacterClasses = (password, result) => {
  const checks = [
    { passed: /[A-Z]/.test(password), message: 'Password must contain at least one uppercase letter' },
    { passed: /[a-z]/.test(password), message: 'Password must contain at least one lowercase letter' },
    { passed: /\d/.test(password), message: 'Password must contain at least one number' },
    { passed: /[^\w\s]/.test(password), message: 'Password must contain at least one special character (!@#$%^&* etc.)' }
  ];

  for (const check of checks) {
    if (check.passed) {
      result.score += 1;
    } else {
      result.feedback.push(check.message);
    }
  }
};

const evaluatePatternRules = (password, email, username, result) => {
  const lowerPassword = password.toLowerCase();
  const commonPatterns = [
    'password',
    '12345678',
    'qwerty',
    'admin',
    'letmein',
    '111111',
    'abc123',
    'password123',
    '123456789',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'sunshine'
  ];

  const hasCommonPattern = commonPatterns.some(pattern => lowerPassword.includes(pattern));
  const emailLocal = email ? email.split('@')[0].toLowerCase() : '';
  const includesEmail = emailLocal ? lowerPassword.includes(emailLocal) : false;
  const includesUsername = username ? lowerPassword.includes(username.toLowerCase()) : false;
  const hasSequence = hasSequentialCharacters(password);

  if (hasCommonPattern) {
    result.feedback.push('Password contains common patterns that are easily guessable');
  } else {
    result.score += 1;
  }

  if (includesEmail) {
    result.feedback.push('Password should not contain your email address');
  }

  if (includesUsername) {
    result.feedback.push('Password should not contain your username');
  }

  if (hasSequence) {
    result.feedback.push('Password contains sequential characters (abc, 123) that should be avoided');
  } else {
    result.score += 1;
  }
};

const evaluateStrength = (result) => {
  if (result.score >= 8) {
    result.strength = PASSWORD_STRENGTH.VERY_STRONG;
    return;
  }

  if (result.score >= 6) {
    result.strength = PASSWORD_STRENGTH.STRONG;
    return;
  }

  if (result.score >= 4) {
    result.strength = PASSWORD_STRENGTH.GOOD;
    return;
  }

  if (result.score >= 2) {
    result.strength = PASSWORD_STRENGTH.FAIR;
  }
};

/**
 * Check if password contains sequential characters
 * Examples: abc, 123, xyz, 456
 * @param {string} password - Password to check
 * @returns {boolean} True if contains sequential characters
 */
const hasSequentialCharacters = (password) => {
  const sequences = [
    'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij', 'ijk', 'jkl', 'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs', 'rst', 'stu', 'tuv', 'uvw', 'vwx', 'wxy', 'xyz',
    '123', '234', '345', '456', '567', '678', '789', '890',
    'qwer', 'wert', 'erty', 'rtyq', 'tyui', 'uiop'
  ];
  
  const lowerPassword = password.toLowerCase();
  return sequences.some(seq => lowerPassword.includes(seq));
};

/**
 * Generate password requirements message
 * @returns {string} Human-readable password requirements
 */
export const getPasswordRequirements = () => {
  return `Password must:
• Be at least 10 characters long
• Include at least one uppercase letter (A-Z)
• Include at least one lowercase letter (a-z)
• Include at least one number (0-9)
• Include at least one special character (!@#$%^&* etc.)
• Not contain common patterns (password, 12345, qwerty, etc.)
• Not contain your email address or username`;
};

/**
 * Calculate password strength percentage
 * @param {string} password - Password to check
 * @returns {number} Strength percentage (0-100)
 */
export const getPasswordStrengthPercentage = (password) => {
  const result = validatePassword(password);
  
  // Map score to percentage
  const percentages = {
    0: 10,
    1: 20,
    2: 30,
    3: 40,
    4: 50,
    5: 60,
    6: 70,
    7: 80,
    8: 90,
    9: 100
  };
  
  return percentages[Math.min(result.score, 9)] || 10;
};
