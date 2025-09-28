const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beacon');
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@student.edu' });
    
    if (existingUser) {
      console.log('Test user already exists:');
      console.log(`Email: ${existingUser.email}`);
      console.log(`Name: ${existingUser.name}`);
      console.log(`Role: ${existingUser.role}`);
      return;
    }

    // Create a test student user
    const testUser = new User({
      name: 'Test Student',
      email: 'test@student.edu',
      password: 'password123', // This will be hashed by the User model
      role: 'student',
      institution: 'Test University',
      city: 'Test City',
      state: 'Test State',
      isActive: true,
      totalPoints: 0,
      level: 1,
      quizStats: {
        totalQuizzes: 0,
        correctAnswers: 0,
        averageScore: 0
      },
      badges: []
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('\nLogin credentials:');
    console.log('Email: test@student.edu');
    console.log('Password: password123');
    console.log('\nYou can now log in to the web application and test the quiz functionality.');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
if (require.main === module) {
  createTestUser();
}

module.exports = createTestUser;
