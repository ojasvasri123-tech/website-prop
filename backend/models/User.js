const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  institution: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  state: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  // Gamification fields
  totalPoints: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Quiz statistics
  quizStats: {
    totalQuizzes: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    }
  },
  // Notification preferences
  notifications: {
    alerts: {
      type: Boolean,
      default: true
    },
    quizzes: {
      type: Boolean,
      default: true
    },
    drills: {
      type: Boolean,
      default: true
    }
  },
  // Push notification subscription
  pushSubscription: {
    type: Object,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate level based on points
userSchema.methods.calculateLevel = function() {
  this.level = Math.floor(this.totalPoints / 100) + 1;
  return this.level;
};

// Add points and update level
userSchema.methods.addPoints = function(points) {
  this.totalPoints += points;
  this.calculateLevel();
  return this.save();
};

// Check if user earned a new badge
userSchema.methods.checkForNewBadges = function() {
  const newBadges = [];
  
  // Quiz Master badge
  if (this.quizStats.totalQuizzes >= 10 && !this.badges.find(b => b.name === 'Quiz Master')) {
    newBadges.push({
      name: 'Quiz Master',
      description: 'Completed 10 quizzes'
    });
  }
  
  // High Scorer badge
  if (this.quizStats.averageScore >= 80 && !this.badges.find(b => b.name === 'High Scorer')) {
    newBadges.push({
      name: 'High Scorer',
      description: 'Maintained 80% average score'
    });
  }
  
  // Points Collector badge
  if (this.totalPoints >= 500 && !this.badges.find(b => b.name === 'Points Collector')) {
    newBadges.push({
      name: 'Points Collector',
      description: 'Earned 500 points'
    });
  }
  
  this.badges.push(...newBadges);
  return newBadges;
};

module.exports = mongoose.model('User', userSchema);
