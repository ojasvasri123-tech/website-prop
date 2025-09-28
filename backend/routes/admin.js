const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Resource = require('../models/Resource');
const { Quiz } = require('../models/Quiz');
const DrillSchedule = require('../models/DrillSchedule');
const Alert = require('../models/Alert');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Apply auth middleware to all admin routes
router.use(auth);
router.use(adminAuth);

// Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalResources = await Resource.countDocuments({ isActive: true });
    const totalQuizzes = await Quiz.countDocuments({ isActive: true });
    const totalDrills = await DrillSchedule.countDocuments();
    const activeAlerts = await Alert.countDocuments({ isActive: true });
    
    // Recent activities
    const recentUsers = await User.find({ role: 'student' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email institution createdAt');
    
    const recentResources = await Resource.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('uploadedBy', 'name')
      .select('title type category createdAt uploadedBy');
    
    const upcomingDrills = await DrillSchedule.find({
      scheduledDate: { $gte: new Date() },
      status: 'scheduled'
    })
      .sort({ scheduledDate: 1 })
      .limit(5)
      .populate('organizer', 'name')
      .select('title type scheduledDate venue organizer');
    
    res.json({
      stats: {
        totalUsers,
        totalAdmins,
        totalResources,
        totalQuizzes,
        totalDrills,
        activeAlerts
      },
      recentActivities: {
        recentUsers,
        recentResources,
        upcomingDrills
      }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, institution } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (institution) query.institution = new RegExp(institution, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle user status
router.put('/users/:userId/toggle-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: { id: user._id, name: user.name, isActive: user.isActive }
    });
    
  } catch (error) {
    console.error('User status toggle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resource management
router.get('/resources', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    
    const resources = await Resource.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
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

// Helper function to extract YouTube video ID from URL
function extractYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Upload resource
router.post('/resources', upload.single('file'), async (req, res) => {
  try {
    const { title, description, type, category, externalUrl, youtubeUrl, tags, difficulty, targetAudience } = req.body;
    
    // Basic validation
    if (!title || !description || !type || !category) {
      return res.status(400).json({ message: 'Title, description, type, and category are required' });
    }
    
    const resourceData = {
      title,
      description,
      type,
      category,
      uploadedBy: req.user._id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      difficulty: difficulty || 'beginner',
      targetAudience: targetAudience || 'both'
    };
    
    // Handle file upload
    if (req.file) {
      resourceData.filePath = req.file.path;
      resourceData.fileName = req.file.originalname;
      resourceData.fileSize = req.file.size;
      resourceData.mimeType = req.file.mimetype;
    }
    
    // Handle external URL
    if (externalUrl) {
      resourceData.externalUrl = externalUrl;
    }
    
    // Handle YouTube video URL
    if (youtubeUrl || req.body.externalUrl) {
      const url = youtubeUrl || req.body.externalUrl;
      const youtubeId = extractYouTubeId(url);
      if (youtubeId) {
        resourceData.youtubeId = youtubeId;
        resourceData.externalUrl = url;
        resourceData.type = 'video'; // Override type for YouTube videos
      } else {
        return res.status(400).json({ message: 'Invalid YouTube URL' });
      }
    }
    
    // Validate resource type and content
    if (type === 'pdf' && !req.file && !externalUrl) {
      return res.status(400).json({ message: 'PDF file or external URL is required for PDF resources' });
    }
    
    if (type === 'video' && !req.file && !youtubeUrl) {
      return res.status(400).json({ message: 'Video file or YouTube URL is required for video resources' });
    }
    
    const resource = new Resource(resourceData);
    await resource.save();
    
    await resource.populate('uploadedBy', 'name email');
    
    res.status(201).json({
      message: 'Resource uploaded successfully',
      resource
    });
    
  } catch (error) {
    console.error('Resource upload error:', error);
    
    // Clean up uploaded file if resource creation fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error during resource upload' });
  }
});

// Update resource
router.put('/resources/:resourceId', async (req, res) => {
  try {
    const { title, description, category, tags, difficulty, targetAudience, isActive } = req.body;
    
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    if (title) resource.title = title;
    if (description) resource.description = description;
    if (category) resource.category = category;
    if (tags) resource.tags = tags.split(',').map(tag => tag.trim());
    if (difficulty) resource.difficulty = difficulty;
    if (targetAudience) resource.targetAudience = targetAudience;
    if (typeof isActive === 'boolean') resource.isActive = isActive;
    
    await resource.save();
    await resource.populate('uploadedBy', 'name email');
    
    res.json({
      message: 'Resource updated successfully',
      resource
    });
    
  } catch (error) {
    console.error('Resource update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete resource
router.delete('/resources/:resourceId', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Delete file if exists
    if (resource.filePath && fs.existsSync(resource.filePath)) {
      fs.unlinkSync(resource.filePath);
    }
    
    await Resource.findByIdAndDelete(req.params.resourceId);
    
    res.json({ message: 'Resource deleted successfully' });
    
  } catch (error) {
    console.error('Resource delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Quiz management
router.get('/quizzes', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, difficulty } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    
    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Quiz.countDocuments(query);
    
    res.json({
      quizzes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Quizzes fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create quiz
router.post('/quizzes', async (req, res) => {
  try {
    const { title, description, category, difficulty, questions, timeLimit, tags } = req.body;
    
    const quiz = new Quiz({
      title,
      description,
      category,
      difficulty: difficulty || 'medium',
      questions,
      timeLimit: timeLimit || 300,
      createdBy: req.user._id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });
    
    await quiz.save();
    await quiz.populate('createdBy', 'name email');
    
    res.status(201).json({
      message: 'Quiz created successfully',
      quiz
    });
    
  } catch (error) {
    console.error('Quiz creation error:', error);
    res.status(500).json({ message: 'Server error during quiz creation' });
  }
});

// Drill schedule management
router.get('/drills', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, institution } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (institution) query.institution = new RegExp(institution, 'i');
    
    const drills = await DrillSchedule.find(query)
      .populate('organizer', 'name email')
      .populate('coordinators.user', 'name email')
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

// Schedule drill
router.post('/drills', async (req, res) => {
  try {
    const drillData = {
      ...req.body,
      organizer: req.user._id
    };
    
    const drill = new DrillSchedule(drillData);
    await drill.save();
    
    await drill.populate('organizer', 'name email');
    
    res.status(201).json({
      message: 'Drill scheduled successfully',
      drill
    });
    
  } catch (error) {
    console.error('Drill scheduling error:', error);
    res.status(500).json({ message: 'Server error during drill scheduling' });
  }
});

// Update drill
router.put('/drills/:drillId', async (req, res) => {
  try {
    const drill = await DrillSchedule.findById(req.params.drillId);
    if (!drill) {
      return res.status(404).json({ message: 'Drill not found' });
    }
    
    // Only allow organizer or admin to update
    if (drill.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    Object.assign(drill, req.body);
    await drill.save();
    
    await drill.populate('organizer', 'name email');
    
    res.json({
      message: 'Drill updated successfully',
      drill
    });
    
  } catch (error) {
    console.error('Drill update error:', error);
    res.status(500).json({ message: 'Server error during drill update' });
  }
});

// Delete drill
router.delete('/drills/:drillId', async (req, res) => {
  try {
    const drill = await DrillSchedule.findById(req.params.drillId);
    if (!drill) {
      return res.status(404).json({ message: 'Drill not found' });
    }
    
    // Only allow organizer or admin to delete
    if (drill.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Don't allow deletion if drill is in progress or has participants
    if (drill.status === 'in-progress') {
      return res.status(400).json({ message: 'Cannot delete drill that is in progress' });
    }
    
    if (drill.registeredParticipants && drill.registeredParticipants.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete drill with registered participants. Cancel the drill instead.' 
      });
    }
    
    await DrillSchedule.findByIdAndDelete(req.params.drillId);
    
    res.json({ message: 'Drill deleted successfully' });
    
  } catch (error) {
    console.error('Drill delete error:', error);
    res.status(500).json({ message: 'Server error during drill deletion' });
  }
});

// Alert management
router.get('/alerts', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, severity, isActive } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (typeof isActive === 'string') query.isActive = isActive === 'true';
    
    const alerts = await Alert.find(query)
      .sort({ issuedAt: -1 })
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

// Create manual alert
router.post('/alerts', async (req, res) => {
  try {
    const alertData = {
      ...req.body,
      source: 'Manual',
      issuedAt: new Date(),
      isVerified: true
    };
    
    const alert = new Alert(alertData);
    await alert.save();
    
    // TODO: Send notifications to affected users
    
    res.status(201).json({
      message: 'Alert created successfully',
      alert
    });
    
  } catch (error) {
    console.error('Alert creation error:', error);
    res.status(500).json({ message: 'Server error during alert creation' });
  }
});

// Resource management
router.get('/resources', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, search } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }
    
    const resources = await Resource.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
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

// Upload resource
router.post('/resources', upload.single('file'), async (req, res) => {
  try {
    const { title, description, type, category, externalUrl, youtubeId, difficulty, targetAudience, tags } = req.body;
    
    const resourceData = {
      title,
      description,
      type,
      category,
      difficulty: difficulty || 'beginner',
      targetAudience: targetAudience || 'both',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [],
      uploadedBy: req.user._id,
      isActive: true
    };

    // Handle file upload
    if (req.file) {
      resourceData.filePath = req.file.path;
      resourceData.fileName = req.file.originalname;
      resourceData.fileSize = req.file.size;
      resourceData.mimeType = req.file.mimetype;
    }

    // Handle external URL (YouTube, etc.)
    if (externalUrl) {
      resourceData.externalUrl = externalUrl;
    }

    // Handle YouTube ID
    if (youtubeId) {
      resourceData.youtubeId = youtubeId;
    }

    const resource = new Resource(resourceData);
    await resource.save();
    
    await resource.populate('uploadedBy', 'name email');
    
    res.status(201).json({
      message: 'Resource uploaded successfully',
      resource
    });
    
  } catch (error) {
    console.error('Resource upload error:', error);
    res.status(500).json({ message: 'Server error during resource upload' });
  }
});

// Update resource
router.put('/resources/:id', upload.single('file'), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const updateData = { ...req.body };
    
    // Handle file upload
    if (req.file) {
      updateData.filePath = req.file.path;
      updateData.fileName = req.file.originalname;
      updateData.fileSize = req.file.size;
      updateData.mimeType = req.file.mimetype;
    }

    Object.assign(resource, updateData);
    await resource.save();
    
    await resource.populate('uploadedBy', 'name email');
    
    res.json({
      message: 'Resource updated successfully',
      resource
    });
    
  } catch (error) {
    console.error('Resource update error:', error);
    res.status(500).json({ message: 'Server error during resource update' });
  }
});

// Delete resource
router.delete('/resources/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    await Resource.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Resource deleted successfully' });
    
  } catch (error) {
    console.error('Resource deletion error:', error);
    res.status(500).json({ message: 'Server error during resource deletion' });
  }
});

// Quiz management
router.get('/quizzes', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, difficulty, search } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }
    
    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Quiz.countDocuments(query);
    
    res.json({
      quizzes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Quizzes fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create quiz
router.post('/quizzes', async (req, res) => {
  try {
    const quizData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const quiz = new Quiz(quizData);
    await quiz.save();
    
    await quiz.populate('createdBy', 'name email');
    
    res.status(201).json({
      message: 'Quiz created successfully',
      quiz
    });
    
  } catch (error) {
    console.error('Quiz creation error:', error);
    res.status(500).json({ message: 'Server error during quiz creation' });
  }
});

// Update quiz
router.put('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    Object.assign(quiz, req.body);
    await quiz.save();
    
    await quiz.populate('createdBy', 'name email');
    
    res.json({
      message: 'Quiz updated successfully',
      quiz
    });
    
  } catch (error) {
    console.error('Quiz update error:', error);
    res.status(500).json({ message: 'Server error during quiz update' });
  }
});

// Delete quiz
router.delete('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    await Quiz.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Quiz deleted successfully' });
    
  } catch (error) {
    console.error('Quiz deletion error:', error);
    res.status(500).json({ message: 'Server error during quiz deletion' });
  }
});

module.exports = router;
