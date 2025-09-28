const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['discussion', 'question', 'tip', 'experience', 'announcement'],
    default: 'discussion'
  },
  category: {
    type: String,
    enum: ['earthquake', 'flood', 'fire', 'cyclone', 'general', 'first-aid', 'evacuation'],
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String],
  // Engagement metrics
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
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Post status
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  // Moderation
  isReported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  },
  // Metadata
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
communityPostSchema.index({ category: 1, type: 1, isActive: 1 });
communityPostSchema.index({ author: 1, isActive: 1 });
communityPostSchema.index({ createdAt: -1 });

// Method to toggle like
communityPostSchema.methods.toggleLike = async function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  
  if (existingLike) {
    // Remove like
    this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  } else {
    // Add like
    this.likes.push({ user: userId });
  }
  
  return await this.save();
};

// Method to add comment
communityPostSchema.methods.addComment = async function(userId, content) {
  this.comments.push({
    user: userId,
    content: content
  });
  
  return await this.save();
};

// Method to remove comment
communityPostSchema.methods.removeComment = async function(commentId) {
  this.comments = this.comments.filter(comment => comment._id.toString() !== commentId.toString());
  return await this.save();
};

module.exports = mongoose.model('CommunityPost', communityPostSchema);
