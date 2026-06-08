import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from './logger.js';

/**
 * File upload handling utilities
 */

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'text/plain'],
  video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
};

/**
 * Validate file
 * @param {object} file - Uploaded file
 * @param {string} category - File category
 * @returns {object} Validation result
 */
export const validateFile = (file, category = 'image') => {
  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return { valid: false, errors };
  }

  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  const allowedMimes = ALLOWED_MIME_TYPES[category] || [];
  if (allowedMimes.length > 0 && !allowedMimes.includes(file.mimetype)) {
    errors.push(`File type not allowed for ${category}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    file,
  };
};

/**
 * Generate unique filename
 * @param {string} originalFilename - Original filename
 * @param {string} category - File category
 * @returns {string} Unique filename
 */
export const generateFilename = (originalFilename, category = 'uploads') => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalFilename);
  const basename = path.basename(originalFilename, extension);
  return `${category}_${timestamp}_${random}${extension}`;
};

/**
 * Get upload directory for category
 * @param {string} category - File category
 * @returns {string} Directory path
 */
export const getUploadDir = (category = 'general') => {
  const dir = path.join(UPLOAD_DIR, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

/**
 * Save uploaded file
 * @param {object} file - File from request
 * @param {string} category - File category
 * @returns {object} File info
 */
export const saveFile = (file, category = 'general') => {
  try {
    const uploadDir = getUploadDir(category);
    const filename = generateFilename(file.originalname, category);
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    logger.info(`File uploaded: ${filename} (${category})`);

    return {
      success: true,
      filename,
      filepath: `/${category}/${filename}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  } catch (error) {
    logger.error(`File upload failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete file
 * @param {string} filepath - File path
 * @returns {boolean} Success
 */
export const deleteFile = (filepath) => {
  try {
    const fullPath = path.join(UPLOAD_DIR, filepath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      logger.info(`File deleted: ${filepath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`File deletion failed: ${error.message}`);
    return false;
  }
};

/**
 * Get file metadata
 * @param {string} filepath - File path
 * @returns {object} File metadata
 */
export const getFileMetadata = (filepath) => {
  try {
    const fullPath = path.join(UPLOAD_DIR, filepath);
    const stats = fs.statSync(fullPath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
    };
  } catch (error) {
    logger.error(`Failed to get file metadata: ${error.message}`);
    return null;
  }
};

/**
 * List files in category
 * @param {string} category - File category
 * @returns {array} File list
 */
export const listFiles = (category = 'general') => {
  try {
    const uploadDir = getUploadDir(category);
    const files = fs.readdirSync(uploadDir);
    return files.map(filename => ({
      filename,
      path: `/${category}/${filename}`,
      metadata: getFileMetadata(`${category}/${filename}`),
    }));
  } catch (error) {
    logger.error(`Failed to list files: ${error.message}`);
    return [];
  }
};

/**
 * Clean up old files
 * @param {string} category - File category
 * @param {number} ageInDays - Age threshold
 * @returns {number} Files deleted
 */
export const cleanupOldFiles = (category = 'general', ageInDays = 30) => {
  try {
    const uploadDir = getUploadDir(category);
    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    const ageInMs = ageInDays * 24 * 60 * 60 * 1000;
    let deleted = 0;

    files.forEach(filename => {
      const filepath = path.join(uploadDir, filename);
      const stats = fs.statSync(filepath);
      if (now - stats.mtime.getTime() > ageInMs) {
        fs.unlinkSync(filepath);
        deleted++;
      }
    });

    logger.info(`Cleanup: deleted ${deleted} old files from ${category}`);
    return deleted;
  } catch (error) {
    logger.error(`Cleanup failed: ${error.message}`);
    return 0;
  }
};

export default {
  validateFile,
  generateFilename,
  getUploadDir,
  saveFile,
  deleteFile,
  getFileMetadata,
  listFiles,
  cleanupOldFiles,
};
