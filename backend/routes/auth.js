const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// POST /api/auth/login - Admin login
router.post('/login',
  [
    body('username')
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Get admin credentials from environment variables
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      
      // Check username
      if (username !== adminUsername) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid credentials'
        });
      }
      
      // For production, you should hash the admin password in the environment
      // For now, we'll do a simple comparison but log a warning
      let isValidPassword = false;
      
      if (adminPassword.startsWith('$2a$') || adminPassword.startsWith('$2b$')) {
        // Password is already hashed
        isValidPassword = await bcrypt.compare(password, adminPassword);
      } else {
        // Password is plain text (development only)
        isValidPassword = password === adminPassword;
        console.warn('⚠️  WARNING: Using plain text admin password. Please hash it for production!');
      }
      
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid credentials'
        });
      }
      
      // Generate JWT token
      const payload = {
        username: adminUsername,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000)
      };
      
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            username: adminUsername,
            role: 'admin'
          },
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Authentication error',
        message: 'Internal server error during login'
      });
    }
  }
);

// POST /api/auth/verify - Verify token validity
router.post('/verify', auth, (req, res) => {
  try {
    // If we reach here, the token is valid (auth middleware passed)
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user,
        isAuthenticated: true
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Verification error',
      message: 'Internal server error during token verification'
    });
  }
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', auth, (req, res) => {
  try {
    // Since JWT is stateless, logout is handled client-side by removing the token
    // We can log the logout event for security monitoring
    console.log(`User ${req.user.username} logged out at ${new Date().toISOString()}`);
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout error',
      message: 'Internal server error during logout'
    });
  }
});

// GET /api/auth/profile - Get current user profile
router.get('/profile', auth, (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          username: req.user.username,
          role: req.user.role,
          loginTime: new Date(req.user.iat * 1000).toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Profile error',
      message: 'Internal server error while fetching profile'
    });
  }
});

// POST /api/auth/change-password - Change admin password (protected)
router.post('/change-password',
  auth,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match');
        }
        return true;
      })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // This is a placeholder for password change functionality
      // In a real application, you would update the password in your user store
      console.log('⚠️  Password change requested but not implemented in this demo version');
      
      res.json({
        success: false,
        message: 'Password change functionality is not implemented in this demo version'
      });
      
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        error: 'Password change error',
        message: 'Internal server error during password change'
      });
    }
  }
);

module.exports = router;
