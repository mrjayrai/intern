/**
 * File Upload Security Validation Middleware
 *
 * Hardens file upload security with:
 * - MIME type validation
 * - File extension validation
 * - File size limits
 * - Path traversal prevention
 */

const path = require('path');
const ApiError = require('../utils/apiError');

// Allowed MIME types for different upload categories
const ALLOWED_MIME_TYPES = {
  resume: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  nda: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  onboarding: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ],
  certificate: [
    'application/pdf'
  ]
};

// Allowed file extensions
const ALLOWED_EXTENSIONS = {
  resume: ['.pdf', '.doc', '.docx', '.txt'],
  nda: ['.pdf', '.doc', '.docx'],
  onboarding: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
  certificate: ['.pdf']
};

// File size limits (in bytes)
const SIZE_LIMITS = {
  resume: 10 * 1024 * 1024,      // 10MB
  nda: 10 * 1024 * 1024,         // 10MB
  onboarding: 15 * 1024 * 1024,  // 15MB
  certificate: 5 * 1024 * 1024   // 5MB
};

/**
 * Validate file MIME type
 */
const validateMimeType = (file, category) => {
  const allowedTypes = ALLOWED_MIME_TYPES[category];
  if (!allowedTypes || !allowedTypes.includes(file.mimetype)) {
    return false;
  }
  return true;
};

/**
 * Validate file extension
 */
const validateExtension = (file, category) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ALLOWED_EXTENSIONS[category];
  if (!allowedExts || !allowedExts.includes(ext)) {
    return false;
  }
  return true;
};

/**
 * Validate file size
 */
const validateSize = (file, category) => {
  const sizeLimit = SIZE_LIMITS[category];
  if (!sizeLimit || file.size > sizeLimit) {
    return false;
  }
  return true;
};

/**
 * Prevent path traversal attacks
 */
const sanitizeFilename = (filename) => {
  // Remove path traversal sequences
  const sanitized = filename
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  return sanitized;
};

/**
 * Comprehensive file validation
 */
const validateFile = (file, category) => {
  const errors = [];

  if (!file) {
    errors.push('File is required');
    return errors;
  }

  // MIME type check
  if (!validateMimeType(file, category)) {
    errors.push(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES[category].join(', ')}`);
  }

  // Extension check
  if (!validateExtension(file, category)) {
    errors.push(`Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS[category].join(', ')}`);
  }

  // Size check
  if (!validateSize(file, category)) {
    const limitMB = (SIZE_LIMITS[category] / (1024 * 1024)).toFixed(0);
    errors.push(`File size exceeds limit of ${limitMB}MB`);
  }

  // Filename sanitization
  if (file.originalname !== sanitizeFilename(file.originalname)) {
    errors.push('Invalid filename. Please use only alphanumeric characters, dots, dashes, and underscores');
  }

  return errors;
};

/**
 * Middleware factory for file upload validation
 */
const createUploadValidator = (category) => {
  return (req, res, next) => {
    try {
      const file = req.file;
      const files = req.files;

      // Handle single file upload
      if (file) {
        const errors = validateFile(file, category);
        if (errors.length > 0) {
          console.warn(`[Security] Invalid file upload attempt: ${file.originalname} | Category: ${category} | Errors: ${errors.join(', ')}`);
          throw new ApiError(400, 'File validation failed', errors);
        }
        console.log(`[Security] File upload validated: ${file.originalname} | Category: ${category}`);
      }

      // Handle multiple file uploads
      if (files && Array.isArray(files)) {
        for (const f of files) {
          const errors = validateFile(f, category);
          if (errors.length > 0) {
            console.warn(`[Security] Invalid file upload attempt: ${f.originalname} | Category: ${category} | Errors: ${errors.join(', ')}`);
            throw new ApiError(400, 'File validation failed', errors);
          }
        }
        console.log(`[Security] ${files.length} file(s) upload validated | Category: ${category}`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  validateFile,
  sanitizeFilename,
  createUploadValidator,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  SIZE_LIMITS
};
