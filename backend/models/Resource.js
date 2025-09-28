const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['pdf', 'video', 'link', 'image', 'document'],
    required: true
  },
  category: {
    type: String,
    enum: ['earthquake', 'flood', 'fire', 'cyclone', 'general', 'first-aid', 'evacuation'],
    required: true
  },
  // File information
  filePath: {
    type: String,
    default: ''
  },
  fileName: {
    type: String,
    default: ''
  },
  fileSize: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String,
    default: ''
  },
  // External link
  externalUrl: {
    type: String,
    default: ''
  },
  // YouTube video ID for embeds
  youtubeId: {
    type: String,
    default: ''
  },
  // Metadata
  duration: {
    type: Number, // in seconds for videos
    default: 0
  },
  tags: [String],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  targetAudience: {
    type: String,
    enum: ['school', 'college', 'both'],
    default: 'both'
  },
  // Upload information
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Engagement metrics
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Comments/Reviews
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate average rating before saving
resourceSchema.pre('save', function(next) {
  if (this.comments.length > 0) {
    const ratingsSum = this.comments.reduce((sum, comment) => sum + (comment.rating || 0), 0);
    this.averageRating = ratingsSum / this.comments.length;
  }
  next();
});

// Method to increment views
resourceSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment downloads
resourceSchema.methods.incrementDownloads = function() {
  this.downloads += 1;
  return this.save();
};

// Method to toggle like
resourceSchema.methods.toggleLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  
  if (existingLike) {
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  } else {
    this.likes.push({ user: userId });
  }
  
  return this.save();
};

module.exports = mongoose.model('Resource', resourceSchema);
