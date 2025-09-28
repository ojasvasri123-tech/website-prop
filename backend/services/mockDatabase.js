// Mock database service for development when MongoDB is not available
class MockDatabase {
  constructor() {
    this.users = [];
    this.nextUserId = 1;
  }

  // User operations
  async createUser(userData) {
    const user = {
      _id: this.nextUserId++,
      ...userData,
      totalPoints: 0,
      level: 1,
      badges: [],
      quizStats: {
        totalQuizzes: 0,
        correctAnswers: 0,
        averageScore: 0
      },
      notifications: {
        alerts: true,
        quizzes: true,
        drills: true
      },
      pushSubscription: null,
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.push(user);
    return user;
  }

  async findUserByEmail(email) {
    return this.users.find(user => user.email === email);
  }

  async findUserById(id) {
    return this.users.find(user => user._id == id);
  }

  async updateUser(id, updateData) {
    const userIndex = this.users.findIndex(user => user._id == id);
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...updateData, updatedAt: new Date() };
      return this.users[userIndex];
    }
    return null;
  }

  // Initialize with some sample data
  init() {
    console.log('🔧 Initializing mock database with sample data...');
    
    // Add a sample admin user
    this.createUser({
      name: 'Admin User',
      email: 'admin@beacon.edu',
      password: 'admin123',
      role: 'admin',
      institution: 'Beacon System',
      city: 'Admin City',
      state: 'Delhi'
    });

    // Add a sample student user
    this.createUser({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'student123',
      role: 'student',
      institution: 'Test University',
      city: 'Mumbai',
      state: 'Maharashtra'
    });

    console.log('✅ Mock database initialized with sample users');
  }

  // Get all users (for admin)
  async getAllUsers() {
    return this.users;
  }

  // Clear all data
  clear() {
    this.users = [];
    this.nextUserId = 1;
  }
}

module.exports = new MockDatabase();
