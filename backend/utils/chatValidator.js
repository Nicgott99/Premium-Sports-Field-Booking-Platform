import logger from './logger.js';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Chat Message Validator and Sanitizer
 * Prevents XSS attacks, validates message format, and enforces content policies
 */

/**
 * Sanitize chat message input
 * Removes HTML/JavaScript to prevent XSS attacks
 * @param {string} message - Raw message text
 * @returns {string} Cleaned message
 */
export const sanitizeChatMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return '';
  }

  // Trim whitespace
  let cleaned = message.trim();

  // Remove HTML/script tags
  try {
    cleaned = DOMPurify.sanitize(cleaned, { ALLOWED_TAGS: [] });
  } catch (error) {
    logger.warn(`DOMPurify sanitization failed: ${error.message}`);
    // Fallback: remove potential script patterns
    cleaned = cleaned
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  return cleaned;
};

/**
 * Validate chat message
 * Checks length, content, and format
 * @param {string} message - Message to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateChatMessage = (message, options = {}) => {
  const {
    minLength = 1,
    maxLength = 2000,
    allowEmpty = false
  } = options;

  if (!message) {
    if (!allowEmpty) {
      return { valid: false, error: 'Message cannot be empty' };
    }
    return { valid: true };
  }

  if (typeof message !== 'string') {
    return { valid: false, error: 'Message must be a string' };
  }

  const trimmed = message.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `Message must be at least ${minLength} character(s)` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Message cannot exceed ${maxLength} characters` };
  }

  return { valid: true };
};

/**
 * Prepare chat message for storage
 * Sanitizes and validates in one step
 * @param {string} message - Raw message
 * @returns {Object} { success: boolean, data?: string, error?: string }
 */
export const prepareChatMessage = (message) => {
  // Validate first
  const validation = validateChatMessage(message);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Sanitize
  try {
    const cleaned = sanitizeChatMessage(message);
    return { success: true, data: cleaned };
  } catch (error) {
    logger.error(`Chat message preparation error: ${error.message}`);
    return { success: false, error: 'Failed to process message' };
  }
};

export default {
  sanitizeChatMessage,
  validateChatMessage,
  prepareChatMessage
};
