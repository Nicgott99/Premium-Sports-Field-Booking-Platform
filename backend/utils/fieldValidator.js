/**
 * fieldValidator.js
 * Schema-based request field validator utility.
 * Premium Sports Field Booking Platform
 *
 * A lightweight, zero-dependency alternative to express-validator for
 * validating request body fields. Returns a structured errors object so
 * controllers can easily return 400 responses without pulling in a schema
 * library.
 *
 * Usage:
 *   import { validate } from '../utils/fieldValidator.js';
 *
 *   const errors = validate(req.body, {
 *     email:    { required: true, type: 'email' },
 *     password: { required: true, minLength: 8, maxLength: 64 },
 *     age:      { type: 'number', min: 16 },
 *   });
 *   if (Object.keys(errors).length) return res.status(400).json({ success: false, errors });
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX   = /^https?:\/\/.+/;
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

/**
 * @typedef {object} FieldRule
 * @property {boolean}  [required]   - Field must be present and non-empty.
 * @property {'string'|'number'|'boolean'|'email'|'url'|'phone'} [type]
 * @property {number}   [minLength]  - Minimum string length.
 * @property {number}   [maxLength]  - Maximum string length.
 * @property {number}   [min]        - Minimum numeric value.
 * @property {number}   [max]        - Maximum numeric value.
 * @property {RegExp}   [pattern]    - Custom regex the value must match.
 * @property {string}   [message]    - Override the default error message.
 */

/**
 * Validate a data object against a schema of field rules.
 * @param {object} data    - Usually req.body.
 * @param {Record<string, FieldRule>} schema
 * @returns {Record<string, string>} - Empty object if valid, otherwise field → message.
 */
export const validate = (data = {}, schema = {}) => {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const raw = data[field];
    const isEmpty = raw === undefined || raw === null || raw === '';

    if (rules.required && isEmpty) {
      errors[field] = rules.message || `${field} is required.`;
      continue;
    }

    if (isEmpty) continue; // optional field not provided — skip further checks

    const str = typeof raw === 'string' ? raw : String(raw);

    switch (rules.type) {
      case 'email':
        if (!EMAIL_REGEX.test(str)) { errors[field] = rules.message || `${field} must be a valid email.`; continue; }
        break;
      case 'url':
        if (!URL_REGEX.test(str))   { errors[field] = rules.message || `${field} must be a valid URL.`; continue; }
        break;
      case 'phone':
        if (!PHONE_REGEX.test(str)) { errors[field] = rules.message || `${field} must be a valid phone number.`; continue; }
        break;
      case 'number':
        if (isNaN(Number(raw)))     { errors[field] = rules.message || `${field} must be a number.`; continue; }
        break;
      case 'boolean':
        if (raw !== true && raw !== false && raw !== 'true' && raw !== 'false') {
          errors[field] = rules.message || `${field} must be a boolean.`; continue;
        }
        break;
      default:
        break;
    }

    if (rules.minLength !== undefined && str.length < rules.minLength) {
      errors[field] = rules.message || `${field} must be at least ${rules.minLength} characters.`; continue;
    }
    if (rules.maxLength !== undefined && str.length > rules.maxLength) {
      errors[field] = rules.message || `${field} must be at most ${rules.maxLength} characters.`; continue;
    }
    if (rules.min !== undefined && Number(raw) < rules.min) {
      errors[field] = rules.message || `${field} must be at least ${rules.min}.`; continue;
    }
    if (rules.max !== undefined && Number(raw) > rules.max) {
      errors[field] = rules.message || `${field} must be at most ${rules.max}.`; continue;
    }
    if (rules.pattern && !rules.pattern.test(str)) {
      errors[field] = rules.message || `${field} has an invalid format.`; continue;
    }
  }

  return errors;
};

export default { validate };
