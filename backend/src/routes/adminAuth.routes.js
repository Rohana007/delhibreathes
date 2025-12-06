const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const logger = require('../utils/logger');

/**
 * POST /api/admin/register
 * Register a new admin (restrict in production)
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password',
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin already exists',
        message: 'An admin with this email already exists',
      });
    }

    // Create new admin
    const admin = new Admin({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Will be hashed by pre-save hook
      role: 'admin',
    });

    await admin.save();

    logger.info(`[Admin Register] New admin created - Email: ${admin.email}`);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    logger.error(`[Admin Register] Error: ${error.message}`);
    console.error('[Admin Register] Full error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate email',
        message: 'An admin with this email already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create admin',
      message: error.message || 'An error occurred while creating admin',
    });
  }
});

/**
 * POST /api/admin/login
 * Login admin with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and password are required',
      });
    }

    // Find admin and include password field
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
    }

    // Compare password
    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token (expires in 7 days)
    // Use ADMIN_JWT_SECRET with fallback to default secure key
    const jwtSecret = process.env.ADMIN_JWT_SECRET || 'DelhiBreathes@Admin2025SecureKey!';
    const token = jwt.sign(
      { 
        id: admin._id.toString(),
        email: admin.email,
        role: admin.role,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    logger.info(`[Admin Login] Admin logged in - Email: ${admin.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    logger.error(`[Admin Login] Error: ${error.message}`);
    console.error('[Admin Login] Full error:', error);

    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message || 'An error occurred while logging in',
    });
  }
});

module.exports = router;

