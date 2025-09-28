const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { getConnectionStatus } = require('../config/database');
const mockDatabase = require('../services/mockDatabase');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, city, state } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    // Set institution to fixed value
    const institution = 'UNITED UNIVERSITY';
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    let user, userData;
    
    if (getConnectionStatus()) {
      // Use MongoDB
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
      
      user = new User({
        name,
        email,
        password, // In production, this should be hashed
        role: role || 'student',
        institution,
        city: city || '',
        state: state || ''
      });
      
      await user.save();
      
      userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
        city: user.city,
        state: user.state,
        totalPoints: user.totalPoints,
        level: user.level,
        badges: user.badges
      };
    } else {
      // Use mock database
      const existingUser = await mockDatabase.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
      
      user = await mockDatabase.createUser({
        name,
        email,
        password, // In production, this should be hashed
        role: role || 'student',
        institution,
        city: city || '',
        state: state || ''
      });
      
      userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
        city: user.city,
        state: user.state,
        totalPoints: user.totalPoints,
        level: user.level,
        badges: user.badges
      };
    }
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userData
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    let user;
    
    if (getConnectionStatus()) {
      // Use MongoDB
      user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
      
      // Check password (simple comparison for college project)
      if (user.password !== password) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(400).json({ message: 'Account is deactivated' });
      }
      
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Use mock database
      user = await mockDatabase.findUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
      
      // Check password (simple comparison for college project)
      if (user.password !== password) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(400).json({ message: 'Account is deactivated' });
      }
      
      user.lastLogin = new Date();
      await mockDatabase.updateUser(user._id, { lastLogin: new Date() });
    }
    
    // Return user data (excluding password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution,
      city: user.city,
      state: user.state,
      totalPoints: user.totalPoints,
      level: user.level,
      badges: user.badges,
      quizStats: user.quizStats,
      notifications: user.notifications
    };
    
    res.json({
      message: 'Login successful',
      user: userData
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, institution, city, state, notifications } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (institution) user.institution = institution;
    if (city) user.city = city;
    if (state) user.state = state;
    if (notifications) user.notifications = { ...user.notifications, ...notifications };
    
    await user.save();
    
    const userData = await User.findById(user._id).select('-password');
    
    res.json({
      message: 'Profile updated successfully',
      user: userData
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Check current password
    if (user.password !== currentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
    
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// Subscribe to push notifications
router.post('/subscribe-push', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    
    const user = await User.findById(req.user._id);
    user.pushSubscription = subscription;
    await user.save();
    
    res.json({ message: 'Push notification subscription saved' });
    
  } catch (error) {
    console.error('Push subscription error:', error);
    res.status(500).json({ message: 'Server error during push subscription' });
  }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const stats = {
      totalPoints: user.totalPoints,
      level: user.level,
      badges: user.badges,
      quizStats: user.quizStats,
      joinedAt: user.createdAt,
      lastLogin: user.lastLogin
    };
    
    res.json({ stats });
    
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout (simple implementation)
router.post('/logout', auth, async (req, res) => {
  try {
    // In a more complex app, you might invalidate tokens here
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router;
