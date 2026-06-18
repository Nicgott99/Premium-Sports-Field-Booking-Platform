export const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isStrongPassword = (password) => {
  return password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password);
};

export const isPhoneNumber = (phone) => /^(\+88)?01[3-9]\d{8}$/.test(phone.replace(/\s/g, ''));

export const isEmpty = (value) => {
  if (typeof value === 'string') return value.trim().length === 0;
  return !value;
};

export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isMinLength = (value, min) => value?.length >= min;

export const isMaxLength = (value, max) => value?.length <= max;

export const isNumeric = (value) => /^\d+$/.test(value);

export const isAlphanumeric = (value) => /^[a-zA-Z0-9]+$/.test(value);

export const validateForm = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = data[field];

    if (rule.required && isEmpty(value)) {
      errors[field] = `${field} is required`;
    } else if (rule.email && value && !isEmail(value)) {
      errors[field] = 'Invalid email address';
    } else if (rule.phone && value && !isPhoneNumber(value)) {
      errors[field] = 'Invalid phone number';
    } else if (rule.minLength && value && !isMinLength(value, rule.minLength)) {
      errors[field] = `${field} must be at least ${rule.minLength} characters`;
    } else if (rule.maxLength && value && !isMaxLength(value, rule.maxLength)) {
      errors[field] = `${field} must be at most ${rule.maxLength} characters`;
    }
  });

  return errors;
};
