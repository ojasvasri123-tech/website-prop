const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
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
    enum: ['earthquake', 'flood', 'cyclone', 'fire', 'weather', 'general'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  source: {
    type: String,
    enum: ['NDMA', 'IMD', 'ISRO', 'SACHET', 'Local Authority', 'Manual'],
    required: true
  },
  sourceUrl: {
    type: String,
    default: ''
  },
  // Location information
  affectedAreas: [{
    state: String,
    city: String,
    district: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  }],
  // Time information
  issuedAt: {
    type: Date,
    required: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  // Alert status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  // Instructions and actions
  instructions: [String],
  emergencyContacts: [{
    name: String,
    phone: String,
    type: String // police, fire, medical, disaster-management
  }],
  // Metadata
  tags: [String],
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  // Engagement tracking
  views: {
    type: Number,
    default: 0
  },
  notificationsSent: {
    type: Number,
    default: 0
  },
  // Additional data from scraping
  rawData: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient querying
alertSchema.index({ type: 1, severity: 1, isActive: 1 });
alertSchema.index({ 'affectedAreas.state': 1, 'affectedAreas.city': 1 });
alertSchema.index({ issuedAt: -1 });

// Method to check if alert is expired
alertSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to get affected users (users in affected areas)
alertSchema.methods.getAffectedUsers = async function() {
  const User = mongoose.model('User');
  const affectedStates = this.affectedAreas.map(area => area.state);
  const affectedCities = this.affectedAreas.map(area => area.city);
  
  return await User.find({
    $or: [
      { state: { $in: affectedStates } },
      { city: { $in: affectedCities } }
    ],
    'notifications.alerts': true,
    isActive: true
  });
};

// Static method to get active alerts for a location
alertSchema.statics.getActiveAlertsForLocation = function(state, city) {
  return this.find({
    isActive: true,
    $or: [
      { 'affectedAreas.state': state },
      { 'affectedAreas.city': city }
    ]
  }).sort({ priority: -1, issuedAt: -1 });
};

module.exports = mongoose.model('Alert', alertSchema);
