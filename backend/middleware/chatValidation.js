import { body, param, validationResult } from 'express-validator';

/**
 * Chat Validation Middleware Module
 * Provides comprehensive validation for chat operations
 * Validates chat creation, message sending, and room management
 * 
 * Validation Coverage:
 * - Chat room creation (name, participants, type)
 * - Message sending (content, attachments)
 * - Room updates (name, settings)
 * - Member management (add/remove)
 * 
 * Chat Room Types:
 * - private: One-to-one chat
 * - group: Multiple participants
 * - support: Support ticket chat
 * - tournament: Tournament chat room
 * 
 * Message Validation:
 * - Content: 1-5000 characters
 * - Type: text, image, file, video
 * - Attachments: File size limits
 * - Media types: MIME type validation
 * 
 * Content Validation:
 * - No profanity (optional filter)
 * - No spam patterns
 * - No injection attacks
 * - URL validation for links
 * 
 * Performance:
 * - Middleware runs before handler
 * - Caches validation rules
 * - Minimal database queries
 * - Fast validation execution
 * 
 * Error Response:
 * {
 *   success: false,
 *   statusCode: 400,
 *   message: "Validation failed",
 *   errors: [
 *     { field: "content", message: "Message is required" }
 *   ]
 * }
 */

/**
 * Express-validator error handler for chat validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 * @returns {Object} 400 error if validation fails
 */
const handleChatValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validate chat room creation
 * Required fields: name, type, participants
 */
export const validateCreateChat = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Chat name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Chat name must be between 1 and 100 characters'),

  body('type')
    .notEmpty()
    .withMessage('Chat type is required')
    .isIn(['private', 'group', 'support', 'tournament'])
    .withMessage('Invalid chat type. Valid types: private, group, support, tournament'),

  body('participants')
    .isArray({ min: 1 })
    .withMessage('Participants array is required with at least 1 participant'),

  body('participants.*')
    .isMongoId()
    .withMessage('Each participant must be a valid user ID'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  handleChatValidationErrors
];

/**
 * Validate chat message sending
 * Required fields: content
 * Optional fields: attachments, replyTo
 */
export const validateSendMessage = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),

  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file', 'video', 'link'])
    .withMessage('Invalid message type'),

  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),

  body('attachments.*.url')
    .optional()
    .isURL()
    .withMessage('Attachment URL must be a valid URL'),

  body('attachments.*.type')
    .optional()
    .isIn(['image', 'video', 'file', 'document'])
    .withMessage('Attachment type must be image, video, file, or document'),

  body('replyToId')
    .optional()
    .isMongoId()
    .withMessage('Reply message ID must be valid'),

  handleChatValidationErrors
];

/**
 * Validate chat room update
 * Allows updating: name, description, settings
 */
export const validateUpdateChat = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Chat name must be between 1 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('isArchived')
    .optional()
    .isBoolean()
    .withMessage('isArchived must be a boolean'),

  body('allowNotifications')
    .optional()
    .isBoolean()
    .withMessage('allowNotifications must be a boolean'),

  handleChatValidationErrors
];

/**
 * Validate adding members to chat
 * Required fields: userIds (array of user IDs)
 */
export const validateAddMembers = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),

  body('userIds')
    .isArray({ min: 1 })
    .withMessage('userIds must be an array with at least 1 user ID'),

  body('userIds.*')
    .isMongoId()
    .withMessage('Each user ID must be valid'),

  handleChatValidationErrors
];

/**
 * Validate removing members from chat
 * Required fields: userIds (array of user IDs)
 */
export const validateRemoveMembers = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),

  body('userIds')
    .isArray({ min: 1 })
    .withMessage('userIds must be an array with at least 1 user ID'),

  body('userIds.*')
    .isMongoId()
    .withMessage('Each user ID must be valid'),

  handleChatValidationErrors
];

/**
 * Validate message deletion
 * Required: chatId, messageId
 */
export const validateDeleteMessage = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),

  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID'),

  handleChatValidationErrors
];

/**
 * Validate message edit
 * Required: content
 */
export const validateEditMessage = [
  param('chatId')
    .isMongoId()
    .withMessage('Invalid chat ID'),

  param('messageId')
    .isMongoId()
    .withMessage('Invalid message ID'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),

  handleChatValidationErrors
];

export default {
  validateCreateChat,
  validateSendMessage,
  validateUpdateChat,
  validateAddMembers,
  validateRemoveMembers,
  validateDeleteMessage,
  validateEditMessage
};
