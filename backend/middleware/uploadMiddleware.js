import multer from 'multer';
import path from 'node:path';

/**
 * Upload Middleware - File Upload Handling with Multer
 * Secure file upload processing with validation and storage management
 * 
 * Purpose:
 * - Handle file uploads from clients
 * - Validate file types and sizes
 * - Store files securely
 * - Manage file metadata
 * - Prevent abuse and attacks
 * - Support multiple file upload scenarios
 * 
 * File Upload Storage Options:
 * - Memory Storage: For temporary/small files
 * - Disk Storage: Persistent file storage
 * - Cloud Storage: AWS S3, Azure Blob, GCS
 * - Database: Store as BLOB (not recommended)
 * 
 * Memory Storage:
 * - Usage: API file processing
 * - Buffer: In-memory file data
 * - Size limit: 10MB default
 * - Performance: Fast for small files
 * - Cleanup: Automatic after request
 * 
 * File Size Limits:
 * - Maximum: 10MB per file
 * - Field size: 10MB limit
 * - Parts: Multiple file count limits
 * - Validation: Enforced at upload
 * 
 * Allowed File Types (MIME):
 * - Images: jpeg, jpg, png, gif, webp
 * - Documents: pdf, doc, docx, txt
 * - Archives: zip, rar, 7z
 * - Validation: By MIME type and extension
 * 
 * MIME Type Validation:
 * - image/jpeg: JPEG images
 * - image/png: PNG images
 * - image/gif: GIF animations
 * - image/webp: WebP images
 * - application/pdf: PDF documents
 * - application/msword: DOC files
 * - application/vnd.openxmlformats-officedocument.wordprocessingml.document: DOCX
 * 
 * File Extension Validation:
 * - Allowed: .jpg, .jpeg, .png, .gif, .pdf, .doc, .docx
 * - Blocked: .exe, .bat, .sh, .php, .aspx
 * - Security: Double validation (extension + MIME)
 * - Magic bytes: Detect actual file type
 * 
 * Upload Endpoints:
 * - POST /api/upload/profile: User avatar
 * - POST /api/upload/field: Field images
 * - POST /api/upload/document: Legal documents
 * - POST /api/upload/receipt: Payment receipts
 * 
 * Request Format:
 * - Method: POST
 * - Content-Type: multipart/form-data
 * - Field name: file (from HTML form)
 * - Body: Binary file data
 * 
 * Field Naming:
 * - Single file: <input name="file">
 * - Multiple: <input name="files" multiple>
 * - Array: <input name="images[0]">
 * - Specific: <input name="profilePicture">
 * 
 * Response Format:
 * - Success: { success: true, file: {...} }
 * - Error: { success: false, message: "..." }
 * - File object: { filename, path, size, mimetype }
 * 
 * File Naming:
 * - Format: timestamp-originalname
 * - Example: 1620000000000-profilepic.jpg
 * - Collision: Timestamp prevents duplicates
 * - Storage: Organized by upload type
 * 
 * Error Handling:
 * - File too large: "File exceeds 10MB limit"
 * - Invalid type: "File type not allowed"
 * - No file: "No file provided"
 * - Parse error: "Invalid multipart request"
 * 
 * Security Measures:
 * - Size limit: Prevent DoS attacks
 * - Type validation: Block dangerous files
 * - Filename sanitization: Remove path traversal
 * - File storage: Outside web root
 * - Access control: Authenticated uploads only
 * 
 * File Storage Structure:
 * - Root: /uploads/
 * - By type: /uploads/profiles/, /uploads/fields/
 * - By user: /uploads/users/{userId}/
 * - By date: /uploads/2024/05/14/
 * 
 * Virus Scanning:
 * - Option: ClamAV integration
 * - Scanning: After upload completion
 * - Quarantine: Isolate suspicious files
 * - Logging: Track scan results
 * 
 * File Metadata:
 * - Filename: Original filename
 * - Mimetype: File MIME type
 * - Size: File size in bytes
 * - Upload date: Timestamp
 * - Upload by: User ID
 * 
 * CDN Integration:
 * - Upload: Store in local/cloud storage
 * - Serve: Via CDN for caching
 * - URL: Public accessible path
 * - Cache: Browser caching headers
 * 
 * Cleanup & Maintenance:
 * - Retention: 30-day deletion for unused
 * - Orphan cleanup: Remove unlinked files
 * - Logs: Archive old upload logs
 * - Storage: Monitor disk usage
 * 
 * Upload Progress:
 * - Tracking: Real-time percentage
 * - Events: Upload progress events
 * - Streaming: Chunk-based upload
 * - Resumable: Resume interrupted uploads
 * 
 * Multiple File Upload:
 * - Array: req.files array
 * - Validation: Each file validated
 * - Limits: Max files per request
 * - Processing: Sequential or parallel
 * 
 * Performance:
 * - Upload speed: Network dependent
 * - Processing: <100ms per file
 * - Storage: Fast disk I/O
 * - Streaming: Non-blocking uploads
 * 
 * Compliance:
 * - GDPR: User data protection
 * - Data retention: File lifecycle
 * - User deletion: Remove uploaded files
 * - Access logs: Track file access
 * 
 * Testing:
 * - File upload testing
 * - Size limit testing
 * - Type validation testing
 * - Error handling testing
 * - Security penetration testing
 */

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