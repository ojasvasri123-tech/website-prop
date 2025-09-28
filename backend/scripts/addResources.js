const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const User = require('../models/User');
require('dotenv').config();

// YouTube video resources to add
const youtubeResources = [
  {
    title: "Earthquake Safety and Preparedness",
    description: "Learn essential earthquake safety measures, what to do during an earthquake, and how to prepare your home and family for seismic events. This comprehensive guide covers drop, cover, and hold techniques, emergency kit preparation, and post-earthquake safety procedures.",
    type: "video",
    category: "earthquake",
    externalUrl: "https://youtu.be/BLEPakj1YTY?si=DGfPon9KbCEcvt1f",
    youtubeId: "BLEPakj1YTY",
    tags: ["earthquake", "safety", "preparedness", "emergency", "disaster-response"],
    difficulty: "beginner",
    targetAudience: "both",
    isActive: true
  },
  {
    title: "Flood Safety and Emergency Response",
    description: "Essential flood safety information including how to prepare for floods, what to do during flooding, evacuation procedures, and post-flood recovery. Learn about flood warning systems, emergency supplies, and how to protect your property from flood damage.",
    type: "video",
    category: "flood",
    externalUrl: "https://youtu.be/43M5mZuzHF8?si=XYaOOPGuIo4SbdHr",
    youtubeId: "43M5mZuzHF8",
    tags: ["flood", "safety", "emergency", "evacuation", "water-safety"],
    difficulty: "beginner",
    targetAudience: "both",
    isActive: true
  }
];

async function addYouTubeResources() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beacon');
    console.log('✅ Connected to MongoDB');

    // Find an admin user to assign as uploader
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log('🔄 Adding YouTube video resources...');
    
    for (const resourceData of youtubeResources) {
      // Check if resource already exists
      const existingResource = await Resource.findOne({ 
        youtubeId: resourceData.youtubeId 
      });
      
      if (existingResource) {
        console.log(`⚠️  Resource "${resourceData.title}" already exists, skipping...`);
        continue;
      }

      const resource = new Resource({
        ...resourceData,
        uploadedBy: adminUser._id
      });

      await resource.save();
      console.log(`✅ Added: ${resource.title}`);
    }

    console.log('\n🎉 YouTube resources added successfully!');
    console.log('\n📹 Added Resources:');
    console.log('- Earthquake Safety and Preparedness');
    console.log('- Flood Safety and Emergency Response');
    
  } catch (error) {
    console.error('❌ Error adding resources:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  addYouTubeResources();
}

module.exports = addYouTubeResources;
