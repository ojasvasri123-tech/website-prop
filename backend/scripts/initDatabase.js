const mongoose = require('mongoose');
const User = require('../models/User');
const { Quiz } = require('../models/Quiz');
const Alert = require('../models/Alert');
const Resource = require('../models/Resource');
const CommunityPost = require('../models/Community');
require('dotenv').config();

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@beacon.edu',
    password: 'admin123',
    role: 'admin',
    institution: 'Beacon System',
    city: 'Admin City',
    state: 'Admin State',
    isActive: true
  },
  {
    name: 'Test Student',
    email: 'student@test.com',
    password: 'student123',
    role: 'student',
    institution: 'Test University',
    city: 'Mumbai',
    state: 'Maharashtra',
    isActive: true
  }
];

const sampleQuizzes = [
  {
    title: "Earthquake Safety Basics",
    description: "Test your knowledge about earthquake preparedness and safety measures.",
    category: "earthquake",
    difficulty: "easy",
    questions: [
      {
        question: "What should you do during an earthquake?",
        options: [
          { text: "Run outside immediately", isCorrect: false },
          { text: "Drop, Cover, and Hold On", isCorrect: true },
          { text: "Stand in a doorway", isCorrect: false },
          { text: "Hide under a bed", isCorrect: false }
        ],
        explanation: "Drop, Cover, and Hold On is the recommended safety response during an earthquake.",
        points: 10
      },
      {
        question: "How long should you keep emergency supplies?",
        options: [
          { text: "1 day", isCorrect: false },
          { text: "3 days", isCorrect: false },
          { text: "7 days", isCorrect: true },
          { text: "1 month", isCorrect: false }
        ],
        explanation: "It's recommended to keep at least 7 days worth of emergency supplies.",
        points: 10
      }
    ],
    timeLimit: 300,
    isActive: true,
    tags: ["earthquake", "safety", "preparedness"]
  }
];

const sampleAlerts = [
  {
    title: "Heavy Rainfall Warning - Mumbai",
    description: "The India Meteorological Department has issued a heavy rainfall warning for Mumbai and surrounding areas. Expect 100-200mm of rainfall in the next 24 hours.",
    type: "flood",
    severity: "high",
    source: "IMD",
    sourceUrl: "https://mausam.imd.gov.in/",
    affectedAreas: [
      { city: "Mumbai", state: "Maharashtra" },
      { city: "Thane", state: "Maharashtra" },
      { city: "Navi Mumbai", state: "Maharashtra" }
    ],
    instructions: [
      "Avoid waterlogged areas and underpasses",
      "Stay indoors unless absolutely necessary",
      "Keep emergency supplies ready",
      "Monitor local news for updates"
    ],
    emergencyContacts: [
      { name: "Mumbai Fire Brigade", phone: "101", type: "fire" },
      { name: "Mumbai Police", phone: "100", type: "police" },
      { name: "Disaster Management", phone: "1078", type: "disaster-management" }
    ],
    issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours from now
    priority: 8,
    isActive: true,
    isVerified: true,
    tags: ["rainfall", "flood", "mumbai"]
  },
  {
    title: "Earthquake Alert - Delhi NCR",
    description: "A moderate earthquake of magnitude 4.2 has been detected in the Delhi NCR region. No immediate damage reported, but residents are advised to stay alert.",
    type: "earthquake",
    severity: "medium",
    source: "ISRO",
    sourceUrl: "https://www.isro.gov.in/",
    affectedAreas: [
      { city: "Delhi", state: "Delhi" },
      { city: "Gurgaon", state: "Haryana" },
      { city: "Noida", state: "Uttar Pradesh" }
    ],
    instructions: [
      "Stay calm and do not panic",
      "Move to open areas if you feel strong tremors",
      "Check for any structural damage in your building",
      "Keep emergency supplies accessible"
    ],
    emergencyContacts: [
      { name: "Delhi Fire Service", phone: "101", type: "fire" },
      { name: "Delhi Police", phone: "100", type: "police" },
      { name: "NDMA Helpline", phone: "1078", type: "disaster-management" }
    ],
    issuedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000), // 23 hours from now
    priority: 6,
    isActive: true,
    isVerified: true,
    tags: ["earthquake", "delhi", "ncr"]
  },
  {
    title: "Cyclone Warning - Coastal Odisha",
    description: "Cyclone 'Amphan' is approaching the coastal areas of Odisha. Wind speeds up to 120 km/h expected. Evacuation orders issued for low-lying areas.",
    type: "cyclone",
    severity: "critical",
    source: "NDMA",
    sourceUrl: "https://ndma.gov.in/",
    affectedAreas: [
      { city: "Bhubaneswar", state: "Odisha" },
      { city: "Puri", state: "Odisha" },
      { city: "Cuttack", state: "Odisha" }
    ],
    instructions: [
      "Evacuate immediately if in low-lying areas",
      "Secure all loose objects around your property",
      "Stock up on food, water, and medical supplies",
      "Stay tuned to official weather updates"
    ],
    emergencyContacts: [
      { name: "Odisha Fire Service", phone: "101", type: "fire" },
      { name: "Odisha Police", phone: "100", type: "police" },
      { name: "State Emergency Operations Center", phone: "1070", type: "disaster-management" }
    ],
    issuedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    priority: 10,
    isActive: true,
    isVerified: true,
    tags: ["cyclone", "odisha", "evacuation"]
  }
];

const sampleResources = [
  {
    title: "Earthquake Preparedness Guide",
    description: "A comprehensive guide on how to prepare for earthquakes, including emergency kits and safety procedures.",
    type: "pdf",
    category: "earthquake",
    externalUrl: "https://www.ready.gov/earthquakes",
    tags: ["guide", "preparedness", "safety"],
    difficulty: "beginner",
    targetAudience: "both",
    isActive: true
  },
  {
    title: "How to Create an Emergency Kit",
    description: "Learn what items to include in your emergency preparedness kit for disasters.",
    type: "video",
    category: "general",
    externalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    tags: ["emergency-kit", "preparedness"],
    difficulty: "beginner",
    targetAudience: "both",
    isActive: true
  },
  {
    title: "Disaster Preparedness and Response Training",
    description: "Comprehensive disaster preparedness and response training video covering essential safety protocols, emergency procedures, and life-saving techniques for various disaster scenarios.",
    type: "video",
    category: "general",
    externalUrl: "https://youtu.be/BLEPakj1YTY?si=zTNRtShkfeK2RGDX",
    youtubeId: "BLEPakj1YTY",
    tags: ["training", "preparedness", "response", "safety", "emergency"],
    difficulty: "intermediate",
    targetAudience: "both",
    isActive: true
  }
];

const sampleCommunityPosts = [
  {
    title: "Tips for earthquake preparedness in apartments",
    content: "Living in a high-rise apartment during an earthquake can be challenging. Here are some tips I've learned: 1) Keep an emergency kit accessible, 2) Know your building's evacuation routes, 3) Practice drop, cover, and hold on regularly. What other tips do you have?",
    type: "tip",
    category: "earthquake",
    tags: ["apartment", "high-rise", "emergency-kit"],
    isActive: true
  }
];

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beacon');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🔄 Clearing existing data...');
    await User.deleteMany({});
    await Quiz.deleteMany({});
    await Alert.deleteMany({});
    await Resource.deleteMany({});
    await CommunityPost.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create users
    console.log('🔄 Creating users...');
    const createdUsers = await User.insertMany(sampleUsers);
    const adminUser = createdUsers.find(user => user.role === 'admin');
    const studentUser = createdUsers.find(user => user.role === 'student');
    console.log('✅ Users created');

    // Create quizzes
    console.log('🔄 Creating quizzes...');
    const quizzesWithCreator = sampleQuizzes.map(quiz => ({
      ...quiz,
      createdBy: adminUser._id
    }));
    await Quiz.insertMany(quizzesWithCreator);
    console.log('✅ Quizzes created');

    // Skip creating sample alerts - use live data from scraping service
    console.log('⏭️ Skipping sample alerts - using live data from scraping service');
    console.log('✅ Alert system configured for live data');

    // Create resources
    console.log('🔄 Creating resources...');
    const resourcesWithUploader = sampleResources.map(resource => ({
      ...resource,
      uploadedBy: adminUser._id
    }));
    await Resource.insertMany(resourcesWithUploader);
    console.log('✅ Resources created');

    // Create community posts
    console.log('🔄 Creating community posts...');
    const postsWithAuthor = sampleCommunityPosts.map(post => ({
      ...post,
      author: studentUser._id
    }));
    await CommunityPost.insertMany(postsWithAuthor);
    console.log('✅ Community posts created');

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('👤 Admin: admin@beacon.edu / admin123');
    console.log('👤 Student: student@test.com / student123');
    console.log('\n📊 Sample Data Created:');
    console.log(`- ${createdUsers.length} Users`);
    console.log(`- ${sampleQuizzes.length} Quizzes`);
    console.log(`- Live Alerts (from NDMA, IMD, SACHET, ISRO)`);
    console.log(`- ${sampleResources.length} Resources`);
    console.log(`- ${sampleCommunityPosts.length} Community Posts`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
