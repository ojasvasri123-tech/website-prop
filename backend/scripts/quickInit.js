const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function quickInit() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beacon');
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('✅ Cleared existing users');

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@beacon.edu',
      password: 'admin123',
      role: 'admin',
      institution: 'Beacon System',
      city: 'Admin City',
      state: 'Admin State',
      isActive: true
    });
    await adminUser.save();
    console.log('✅ Admin user created');

    // Create test student
    const studentUser = new User({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'student123',
      role: 'student',
      institution: 'Test University',
      city: 'Mumbai',
      state: 'Maharashtra',
      isActive: true
    });
    await studentUser.save();
    console.log('✅ Student user created');

    console.log('\n🎉 Quick initialization completed!');
    console.log('\n📋 Login Credentials:');
    console.log('👤 Admin: admin@beacon.edu / admin123');
    console.log('👤 Student: student@test.com / student123');

  } catch (error) {
    console.error('❌ Initialization failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

quickInit();
