const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class FileUploadService {
  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    this.maxFileSize = 5 * 1024 * 1024; // 5 MB
    this.allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    this.baseUrl = process.env.UPLOAD_BASE_URL || '/uploads';
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create upload directory: ${error.message}`);
    }
  }

  /**
   * Validate file
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed: ${this.allowedMimeTypes.join(', ')}`);
    }

    return true;
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `report_${timestamp}_${random}${ext}`;
  }

  /**
   * Save file to disk
   */
  async saveFile(file) {
    try {
      this.validateFile(file);

      const filename = this.generateFilename(file.originalname);
      const filepath = path.join(this.uploadDir, filename);

      // Save file
      await fs.writeFile(filepath, file.buffer);

      const url = `${this.baseUrl}/${filename}`;
      logger.info(`File uploaded: ${filename}`);

      return {
        filename,
        filepath,
        url,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      logger.error(`File upload error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save multiple files
   */
  async saveFiles(files) {
    if (!files || files.length === 0) {
      return [];
    }

    if (files.length > 3) {
      throw new Error('Maximum 3 images allowed');
    }

    const results = [];
    for (const file of files) {
      try {
        const result = await this.saveFile(file);
        results.push(result);
      } catch (error) {
        logger.error(`Failed to save file ${file.originalname}: ${error.message}`);
        // Continue with other files
      }
    }

    return results;
  }

  /**
   * Delete file
   */
  async deleteFile(filename) {
    try {
      const filepath = path.join(this.uploadDir, filename);
      await fs.unlink(filepath);
      logger.info(`File deleted: ${filename}`);
    } catch (error) {
      logger.warn(`Failed to delete file ${filename}: ${error.message}`);
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(filename) {
    return `${this.baseUrl}/${filename}`;
  }
}

module.exports = new FileUploadService();

