const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Get upload directory from environment or use default
// Resolve to absolute path for consistency
const uploadDir = process.env.UPLOAD_DIR 
  ? (path.isAbsolute(process.env.UPLOAD_DIR) 
      ? process.env.UPLOAD_DIR 
      : path.join(__dirname, '..', '..', process.env.UPLOAD_DIR))
  : path.join(__dirname, '..', '..', 'uploads');

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`[Upload] Created upload directory: ${uploadDir}`);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `report-${uniqueSuffix}${ext}`);
  },
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: fileFilter,
});

// Middleware for single image upload (supports both 'image' and 'photo' field names)
// Use upload.any() to accept any field name, then filter to get the first image
const handleUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File too large',
            message: 'Image size must be less than 5MB',
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Upload error',
          message: err.message,
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'Upload error',
        message: err.message,
      });
    }
    
    // If files were uploaded, set req.file to the first image file
    // This maintains compatibility with code expecting req.file
    if (req.files && req.files.length > 0) {
      const imageFile = req.files.find(file => 
        file.mimetype.startsWith('image/')
      );
      if (imageFile) {
        req.file = imageFile;
      }
    }
    
    next();
  });
};

// For backward compatibility, also export uploadSingle
const uploadSingle = upload.single('image');

module.exports = {
  upload,
  handleUpload,
  uploadSingle,
};

