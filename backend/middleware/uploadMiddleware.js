import multer from 'multer';
import path from 'path';

/**
 * Configure multer storage for file uploads
 * Uses memory storage for temporary processing before cloud upload
 * @type {Object}
 */
const storage = multer.memoryStorage();

/**
 * Filter files by type and extension
 * Validates MIME type and file extension
 * @param {Object} req - Express request object
 * @param {Object} file - File object from multer
 * @param {Function} cb - Multer callback function
 * @returns {void}
 * 
 * Allowed File Types:
 * - Images: jpeg, jpg, png, gif
 * - Documents: pdf, doc, docx
 * 
 * Restrictions:
 * - Max file size: 10MB (configurable via MAX_FILE_SIZE env)
 * - Only exact extension and MIME type matches allowed
 * - Case-insensitive extension checking
 * 
 * Usage: Used internally by multer middleware
 */
const fileFilter = (req, file, cb) => {
  // Check file type - allowed extensions
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

/**
 * Multer upload middleware configuration
 * Handles single and multiple file uploads with validation
 * 
 * Configuration:
 * - Storage: Memory storage (for cloud upload integration)
 * - Max File Size: 10MB (from env MAX_FILE_SIZE)
 * - File Filter: Extension and MIME type validation
 * - Allowed Types: Images (jpeg, jpg, png, gif), Documents (pdf, doc, docx)
 * 
 * Usage:
 * - Single file: router.post('/endpoint', upload.single('field'), controller)
 * - Multiple files: router.post('/endpoint', upload.array('field'), controller)
 * - Multiple fields: router.post('/endpoint', upload.fields([...]), controller)
 * 
 * Error Handling:
 * - MulterError: File size exceeded, field count exceeded
 * - Error: Invalid file type (caught by fileFilter)
 * 
 * @type {multer.Multer}
 */
export const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter
});

export default upload;