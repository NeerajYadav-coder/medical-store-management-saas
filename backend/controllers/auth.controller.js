/**
 * controllers/auth.controller.js
 *
 * Responsibility:
 * - Handle login logic
 * - Validate credentials
 * - Generate JWT token
 * - Provide current user info
 *
 * NO routing logic here
 * NO direct response formatting elsewhere
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

/**
 * Utility: Generate JWT Access Token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      medicalStoreId: user.medicalStoreId,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    }
  );
};

/**
 * -----------------------
 * LOGIN
 * -----------------------
 * POST /api/v1/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    /**
     * Find user
     * - email lookup
     * - active user only
     */
    const user = await User.findOne({ email }).lean(false);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    /**
     * Compare password
     */
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    /**
     * Generate JWT
     */
    const accessToken = generateAccessToken(user);

    // Update last login time
    user.lastLoginAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        medicalStoreId: user.medicalStoreId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * GET CURRENT USER
 * -----------------------
 * GET /api/v1/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    /**
     * req.user comes from auth.middleware.js
     * NEVER trust frontend for this
     */
    const user = await User.findById(req.user.userId)
      .select('-passwordHash')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------
 * LOGOUT
 * -----------------------
 * POST /api/v1/auth/logout
 *
 * Stateless JWT → frontend just deletes token
 */
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
