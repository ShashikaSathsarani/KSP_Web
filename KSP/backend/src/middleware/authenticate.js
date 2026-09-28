const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Bearer token required'
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    const isExpired = error.name === 'TokenExpiredError';
    return res.status(isExpired ? 401 : 403).json({
      success: false,
      message: isExpired ? 'Token expired' : 'Invalid token'
    });
  }

  if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid user token'
    });
  }

  try {
    const user = await User.findById(decoded.id)
      .select('_id email firstName lastName role isActive');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found'
      });
    }

    if (user.isActive !== true) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    return next();
  } catch (error) {
    console.error('Authentication user lookup failed:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Authentication service unavailable'
    });
  }
};

module.exports = authenticateToken;
