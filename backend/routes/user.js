const express = require('express');
const { auth, optionalAuth } = require('../middleware/auth');
const Resource = require('../models/Resource');
const { Quiz, QuizAttempt } = require('../models/Quiz');
const DrillSchedule = require('../models/DrillSchedule');
const Alert = require('../models/Alert');
const User = require('../models/User');
const CommunityPost = require('../models/Community');

const router = express.Router();

// Get user dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Get recent resources
    const recentResources = await Resource.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('uploadedBy', 'name')
      .select('title description type category createdAt uploadedBy views averageRating');
    
    // Get active alerts for user's location
    const activeAlerts = await Alert.getActiveAlertsForLocation(user.state, user.city)
      .limit(5);
    
    // Get upcoming drills for user's institution
    const upcomingDrills = await DrillSchedule.getUpcomingDrills(user.institution, 3);
    
    // Get available quizzes (not yet attempted by user)
    const attemptedQuizIds = await QuizAttempt.find({ user: user._id }).distinct('quiz');
    const availableQuizzes = await Quiz.find({
      _id: { $nin: attemptedQuizIds },
      isActive: true
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title description category difficulty totalPoints timeLimit');
    
    // Get user's recent quiz attempts
    const recentAttempts = await QuizAttempt.find({ user: user._id })
      .populate('quiz', 'title category')
      .sort({ completedAt: -1 })
      .limit(5);
    
    // Get leaderboard position
    const usersWithHigherPoints = await User.countDocuments({
      totalPoints: { $gt: user.totalPoints },
      role: 'student'
    });
    const leaderboardPosition = usersWithHigherPoints + 1;
    
    // Get recent community posts
    const recentCommunityPosts = await CommunityPost.find({ isActive: true })
      .populate('author', 'name institution')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title content type category createdAt author likes comments');
    
    res.json({
      user: {
        name: user.name,
        totalPoints: user.totalPoints,
        level: user.level,
        badges: user.badges,
        leaderboardPosition
      },
      recentResources,
      activeAlerts,
      upcomingDrills,
      availableQuizzes,
      recentAttempts,
      recentCommunityPosts
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all resources with filtering
router.get('/resources', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 12, type, category, difficulty, search } = req.query;
    
    const query = { isActive: true };
    if (type) query.type = type;
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }
    
    const resources = await Resource.find(query)
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-comments'); // Exclude comments for list view
    
    const total = await Resource.countDocuments(query);
    
    res.json({
      resources,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Resources fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single resource with details
router.get('/resources/:resourceId', optionalAuth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId)
      .populate('uploadedBy', 'name')
      .populate('comments.user', 'name')
      .populate('likes.user', 'name');
    
    if (!resource || !resource.isActive) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Increment view count
    await resource.incrementViews();
    
    res.json({ resource });
    
  } catch (error) {
    console.error('Resource fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/unlike resource
router.post('/resources/:resourceId/like', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource || !resource.isActive) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    await resource.toggleLike(req.user._id);
    
    res.json({
      message: 'Like toggled successfully',
      likesCount: resource.likes.length
    });
    
  } catch (error) {
    console.error('Like toggle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to resource
router.post('/resources/:resourceId/comments', auth, async (req, res) => {
  try {
    const { text, rating } = req.body;
    
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource || !resource.isActive) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    resource.comments.push({
      user: req.user._id,
      text,
      rating: rating || null
    });
    
    await resource.save();
    await resource.populate('comments.user', 'name');
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment: resource.comments[resource.comments.length - 1]
    });
    
  } catch (error) {
    console.error('Comment add error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download resource
router.get('/resources/:resourceId/download', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource || !resource.isActive) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    if (!resource.filePath) {
      return res.status(400).json({ message: 'No file available for download' });
    }
    
    // Increment download count
    await resource.incrementDownloads();
    
    res.download(resource.filePath, resource.fileName);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active alerts for user's location
router.get('/alerts', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, severity } = req.query;
    
    const query = {
      isActive: true,
      $or: [
        { 'affectedAreas.state': req.user.state },
        { 'affectedAreas.city': req.user.city }
      ]
    };
    
    if (type) query.type = type;
    if (severity) query.severity = severity;
    
    const alerts = await Alert.find(query)
      .sort({ priority: -1, issuedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Alert.countDocuments(query);
    
    res.json({
      alerts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Alerts fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get drill schedules for user's institution
router.get('/drills', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    
    const query = { institution: req.user.institution };
    if (status) query.status = status;
    if (type) query.type = type;
    
    const drills = await DrillSchedule.find(query)
      .populate('organizer', 'name email')
      .sort({ scheduledDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await DrillSchedule.countDocuments(query);
    
    res.json({
      drills,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Drills fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register for drill
router.post('/drills/:drillId/register', auth, async (req, res) => {
  try {
    const drill = await DrillSchedule.findById(req.params.drillId);
    if (!drill) {
      return res.status(404).json({ message: 'Drill not found' });
    }
    
    if (drill.institution !== req.user.institution) {
      return res.status(403).json({ message: 'You can only register for drills in your institution' });
    }
    
    await drill.registerParticipant(req.user._id);
    
    res.json({ message: 'Successfully registered for drill' });
    
  } catch (error) {
    console.error('Drill registration error:', error);
    res.status(400).json({ message: error.message || 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, institution } = req.query;
    
    const query = { role: 'student', isActive: true };
    if (institution) query.institution = institution;
    
    const users = await User.find(query)
      .select('name institution totalPoints level badges')
      .sort({ totalPoints: -1, createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    // Add rank to each user
    const leaderboard = users.map((user, index) => ({
      ...user.toObject(),
      rank: (page - 1) * limit + index + 1
    }));
    
    res.json({
      leaderboard,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's quiz history
router.get('/quiz-history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .populate('quiz', 'title category difficulty totalPoints')
      .sort({ completedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await QuizAttempt.countDocuments({ user: req.user._id });
    
    res.json({
      attempts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Quiz history fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Community/Forum endpoints would go here
// For now, we'll implement basic Q&A functionality

// Get community posts/questions
router.get('/community', optionalAuth, async (req, res) => {
  try {
    // This is a placeholder for community functionality
    // In a full implementation, you'd have a separate model for community posts
    res.json({
      message: 'Community feature coming soon',
      posts: []
    });
  } catch (error) {
    console.error('Community fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
