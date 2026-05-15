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
  const result = {
    isValid: false,
    strength: PASSWORD_STRENGTH.WEAK,
    feedback: [],
    score: 0
  };
  
  if (!password) {
    result.feedback.push('Password is required');
    return result;
  }
  
  // Length check (10+ chars recommended)
  if (password.length < 10) {
    result.feedback.push('Password must be at least 10 characters long');
  } else if (password.length < 12) {
    result.score += 1;
  } else {
    result.score += 2;
  }
  
  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    result.feedback.push('Password must contain at least one uppercase letter');
  } else {
    result.score += 1;
  }
  
  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    result.feedback.push('Password must contain at least one lowercase letter');
  } else {
    result.score += 1;
  }
  
  // Number check
  if (!/[0-9]/.test(password)) {
    result.feedback.push('Password must contain at least one number');
  } else {
    result.score += 1;
  }
  
  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    result.feedback.push('Password must contain at least one special character (!@#$%^&* etc.)');
  } else {
    result.score += 1;
  }
  
  // Check for common patterns
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
  
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    result.feedback.push('Password contains common patterns that are easily guessable');
  } else {
    result.score += 1;
  }
  
  // Check similarity to email
  if (email) {
    const emailLocal = email.split('@')[0].toLowerCase();
    if (password.toLowerCase().includes(emailLocal)) {
      result.feedback.push('Password should not contain your email address');
    }
  }
  
  // Check similarity to username
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    result.feedback.push('Password should not contain your username');
  }
  
  // Check for sequential characters
  if (hasSequentialCharacters(password)) {
    result.feedback.push('Password contains sequential characters (abc, 123) that should be avoided');
  } else {
    result.score += 1;
  }
  
  // Determine strength level
  if (result.score >= 8) {
    result.strength = PASSWORD_STRENGTH.VERY_STRONG;
  } else if (result.score >= 6) {
    result.strength = PASSWORD_STRENGTH.STRONG;
  } else if (result.score >= 4) {
    result.strength = PASSWORD_STRENGTH.GOOD;
  } else if (result.score >= 2) {
    result.strength = PASSWORD_STRENGTH.FAIR;
  }
  
  // Password is valid if it has no feedback (all checks passed)
  result.isValid = result.feedback.length === 0;
  
  return result;
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
