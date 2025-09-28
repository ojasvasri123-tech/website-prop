const User = require('../models/User');

// Simple session-based authentication (no JWT for college project)
const auth = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'];
    
    if (!userId) {
      console.log('Auth error: No user-id header provided');
      return res.status(401).json({ message: 'Access denied. No user ID provided.' });
    }
    
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Auth error: Invalid user-id format:', userId);
      return res.status(401).json({ message: 'Invalid user ID format.' });
    }
    
    const user = await User.findById(userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid authentication.' });
  }
};

// Admin authorization middleware
const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    res.status(403).json({ message: 'Access denied.' });
  }
};

// Optional auth - doesn't fail if no user
const optionalAuth = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'];
    
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

module.exports = { auth, adminAuth, optionalAuth };
