const mongoose = require('mongoose');

const drillScheduleSchema = new mongoose.Schema({
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
    enum: ['fire', 'earthquake', 'flood', 'evacuation', 'general'],
    required: true
  },
  // Scheduling information
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  // Location details
  venue: {
    type: String,
    required: true
  },
  institution: {
    type: String,
    required: true
  },
  // Participants
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'staff', 'specific-groups'],
    default: 'all'
  },
  specificGroups: [String], // class names, department names, etc.
  maxParticipants: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  // Drill details
  objectives: [String],
  instructions: [String],
  safetyGuidelines: [String],
  equipmentRequired: [String],
  // Status tracking
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  // Organizer information
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coordinators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String,
    contactNumber: String
  }],
  // Emergency contacts during drill
  emergencyContacts: [{
    name: String,
    role: String,
    phone: String,
    email: String
  }],
  // Participation tracking
  registeredParticipants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    attended: {
      type: Boolean,
      default: false
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      submittedAt: Date
    }
  }],
  // Results and feedback
  completionReport: {
    actualDuration: Number, // in minutes
    participantCount: Number,
    successRate: Number, // percentage
    issues: [String],
    improvements: [String],
    overallRating: Number,
    reportSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportSubmittedAt: Date
  },
  // Notification settings
  notifications: {
    reminder24h: {
      type: Boolean,
      default: true
    },
    reminder1h: {
      type: Boolean,
      default: true
    },
    startNotification: {
      type: Boolean,
      default: true
    }
  },
  // Additional metadata
  tags: [String],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly']
    },
    interval: Number, // every X weeks/months/etc
    endDate: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
drillScheduleSchema.index({ scheduledDate: 1, status: 1 });
drillScheduleSchema.index({ institution: 1, scheduledDate: 1 });

// Method to check if registration is open
drillScheduleSchema.methods.isRegistrationOpen = function() {
  const now = new Date();
  const drillDate = new Date(this.scheduledDate);
  const registrationDeadline = new Date(drillDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
  
  return now < registrationDeadline && this.status === 'scheduled';
};

// Method to register a participant
drillScheduleSchema.methods.registerParticipant = function(userId) {
  // Check if already registered
  const existingRegistration = this.registeredParticipants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (existingRegistration) {
    throw new Error('User already registered for this drill');
  }
  
  // Check capacity
  if (this.maxParticipants > 0 && this.registeredParticipants.length >= this.maxParticipants) {
    throw new Error('Drill is at maximum capacity');
  }
  
  // Check if registration is open
  if (!this.isRegistrationOpen()) {
    throw new Error('Registration is closed for this drill');
  }
  
  this.registeredParticipants.push({ user: userId });
  return this.save();
};

// Method to mark attendance
drillScheduleSchema.methods.markAttendance = function(userId, attended = true) {
  const participant = this.registeredParticipants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('User not registered for this drill');
  }
  
  participant.attended = attended;
  return this.save();
};

// Static method to get upcoming drills for an institution
drillScheduleSchema.statics.getUpcomingDrills = function(institution, limit = 10) {
  return this.find({
    institution: institution,
    scheduledDate: { $gte: new Date() },
    status: 'scheduled'
  })
  .sort({ scheduledDate: 1 })
  .limit(limit)
  .populate('organizer', 'name email')
  .populate('coordinators.user', 'name email');
};

module.exports = mongoose.model('DrillSchedule', drillScheduleSchema);
