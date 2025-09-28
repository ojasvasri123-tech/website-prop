const mongoose = require('mongoose');
const { Quiz } = require('../models/Quiz');
const User = require('../models/User');
require('dotenv').config();

// Comprehensive disaster preparedness quizzes
const disasterQuizzes = [
  {
    title: "Earthquake Safety and Preparedness",
    description: "Test your knowledge about earthquake safety measures, emergency procedures, and preparedness strategies. Learn what to do before, during, and after an earthquake.",
    category: "earthquake",
    difficulty: "easy",
    timeLimit: 600, // 10 minutes
    questions: [
      {
        question: "What is the correct action to take immediately when you feel an earthquake?",
        options: [
          { text: "Run outside as quickly as possible", isCorrect: false },
          { text: "Drop, Cover, and Hold On", isCorrect: true },
          { text: "Stand in a doorway", isCorrect: false },
          { text: "Get under a bed", isCorrect: false }
        ],
        explanation: "Drop, Cover, and Hold On is the internationally recommended response. Drop to hands and knees, take cover under a sturdy desk or table, and hold on to your shelter.",
        points: 10
      },
      {
        question: "How long should you keep emergency supplies for earthquake preparedness?",
        options: [
          { text: "1 day", isCorrect: false },
          { text: "3 days", isCorrect: false },
          { text: "7 days", isCorrect: true },
          { text: "1 month", isCorrect: false }
        ],
        explanation: "Experts recommend keeping at least 7 days worth of emergency supplies, as it may take that long for help to arrive after a major earthquake.",
        points: 10
      },
      {
        question: "What should be included in an earthquake emergency kit?",
        options: [
          { text: "Water, food, flashlight, and first aid kit", isCorrect: true },
          { text: "Only water and food", isCorrect: false },
          { text: "Just a flashlight and batteries", isCorrect: false },
          { text: "Only important documents", isCorrect: false }
        ],
        explanation: "A complete emergency kit should include water (1 gallon per person per day), non-perishable food, flashlight, first aid kit, medications, and important documents.",
        points: 10
      },
      {
        question: "After an earthquake stops, what should you do first?",
        options: [
          { text: "Check for injuries and hazards", isCorrect: true },
          { text: "Immediately call everyone you know", isCorrect: false },
          { text: "Go outside to see the damage", isCorrect: false },
          { text: "Turn on all electrical appliances", isCorrect: false }
        ],
        explanation: "First priority is to check yourself and others for injuries, then check for hazards like gas leaks, electrical damage, or structural damage before taking other actions.",
        points: 10
      },
      {
        question: "Which location is safest during an earthquake if you're indoors?",
        options: [
          { text: "Near windows to see outside", isCorrect: false },
          { text: "Under a sturdy table or desk", isCorrect: true },
          { text: "In a doorway", isCorrect: false },
          { text: "Against an exterior wall", isCorrect: false }
        ],
        explanation: "Under a sturdy table or desk provides the best protection from falling objects. Doorways are not safer than other locations in modern buildings.",
        points: 10
      }
    ],
    tags: ["earthquake", "safety", "emergency", "preparedness", "disaster-response"],
    isActive: true
  },
  {
    title: "Flood Safety and Emergency Response",
    description: "Learn about flood safety, evacuation procedures, and how to stay safe during flooding events. Understand flood warnings and emergency response protocols.",
    category: "flood",
    difficulty: "easy",
    timeLimit: 600, // 10 minutes
    questions: [
      {
        question: "How much water can knock you down while walking?",
        options: [
          { text: "12 inches (30 cm)", isCorrect: false },
          { text: "6 inches (15 cm)", isCorrect: true },
          { text: "18 inches (45 cm)", isCorrect: false },
          { text: "24 inches (60 cm)", isCorrect: false }
        ],
        explanation: "Just 6 inches of moving water can knock you down. It's much more powerful than people realize, which is why you should never walk through flood water.",
        points: 10
      },
      {
        question: "What should you do if your car gets caught in flood water?",
        options: [
          { text: "Try to drive through it quickly", isCorrect: false },
          { text: "Stay in the car and wait", isCorrect: false },
          { text: "Abandon the car and get to higher ground", isCorrect: true },
          { text: "Call for help and stay in the car", isCorrect: false }
        ],
        explanation: "If your car is caught in flood water, abandon it immediately and get to higher ground. Cars can be swept away by just 12 inches of moving water.",
        points: 10
      },
      {
        question: "What does 'Turn Around, Don't Drown' mean?",
        options: [
          { text: "Don't go swimming during floods", isCorrect: false },
          { text: "Don't drive or walk through flood water", isCorrect: true },
          { text: "Don't look at flood damage", isCorrect: false },
          { text: "Don't help flood victims", isCorrect: false }
        ],
        explanation: "'Turn Around, Don't Drown' is a safety slogan reminding people not to drive or walk through flood water, as it's extremely dangerous and often deeper than it appears.",
        points: 10
      },
      {
        question: "During a flood warning, what should you do first?",
        options: [
          { text: "Go to the basement for safety", isCorrect: false },
          { text: "Move to higher ground immediately", isCorrect: true },
          { text: "Stay where you are and wait", isCorrect: false },
          { text: "Go outside to see the flood", isCorrect: false }
        ],
        explanation: "When a flood warning is issued, move to higher ground immediately. Basements and low-lying areas are the most dangerous places during floods.",
        points: 10
      },
      {
        question: "How much water can float a vehicle?",
        options: [
          { text: "6 inches (15 cm)", isCorrect: false },
          { text: "12 inches (30 cm)", isCorrect: true },
          { text: "24 inches (60 cm)", isCorrect: false },
          { text: "36 inches (90 cm)", isCorrect: false }
        ],
        explanation: "Just 12 inches of water can float most vehicles, including SUVs and trucks. This is why you should never attempt to drive through flood water.",
        points: 10
      }
    ],
    tags: ["flood", "water-safety", "emergency", "evacuation", "disaster-response"],
    isActive: true
  },
  {
    title: "General Disaster Preparedness",
    description: "Test your overall knowledge of disaster preparedness, emergency planning, and general safety measures that apply to multiple types of disasters.",
    category: "general",
    difficulty: "medium",
    timeLimit: 900, // 15 minutes
    questions: [
      {
        question: "What is the most important thing to have in any emergency kit?",
        options: [
          { text: "Food", isCorrect: false },
          { text: "Water", isCorrect: true },
          { text: "Flashlight", isCorrect: false },
          { text: "Radio", isCorrect: false }
        ],
        explanation: "Water is the most critical item. You can survive weeks without food, but only days without water. Store 1 gallon per person per day.",
        points: 15
      },
      {
        question: "How often should you update your emergency plan?",
        options: [
          { text: "Once a year", isCorrect: true },
          { text: "Every 5 years", isCorrect: false },
          { text: "Only when moving", isCorrect: false },
          { text: "Never, once is enough", isCorrect: false }
        ],
        explanation: "Emergency plans should be reviewed and updated annually, or whenever there are changes in your family, work, or living situation.",
        points: 15
      },
      {
        question: "What should you do if you receive an emergency alert on your phone?",
        options: [
          { text: "Ignore it if you're busy", isCorrect: false },
          { text: "Read it immediately and take appropriate action", isCorrect: true },
          { text: "Wait to see if others received it too", isCorrect: false },
          { text: "Turn off your phone to avoid panic", isCorrect: false }
        ],
        explanation: "Emergency alerts are sent for serious, immediate threats to safety. Read them immediately and follow the instructions provided.",
        points: 15
      },
      {
        question: "Where should you meet your family if you get separated during a disaster?",
        options: [
          { text: "At home only", isCorrect: false },
          { text: "At a predetermined meeting place", isCorrect: true },
          { text: "At the nearest hospital", isCorrect: false },
          { text: "At the police station", isCorrect: false }
        ],
        explanation: "Families should have predetermined meeting places both near their home and outside their neighborhood in case they can't return home.",
        points: 15
      }
    ],
    tags: ["general", "preparedness", "emergency-planning", "safety", "disaster-response"],
    isActive: true
  }
];

async function addDisasterQuizzes() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beacon');
    console.log('✅ Connected to MongoDB');

    // Find an admin user to assign as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log('🔄 Adding disaster preparedness quizzes...');
    
    for (const quizData of disasterQuizzes) {
      // Check if quiz already exists
      const existingQuiz = await Quiz.findOne({ 
        title: quizData.title 
      });
      
      if (existingQuiz) {
        console.log(`⚠️  Quiz "${quizData.title}" already exists, skipping...`);
        continue;
      }

      const quiz = new Quiz({
        ...quizData,
        createdBy: adminUser._id
      });

      await quiz.save();
      console.log(`✅ Added: ${quiz.title} (${quiz.questions.length} questions, ${quiz.totalPoints} points)`);
    }

    console.log('\n🎉 Disaster preparedness quizzes added successfully!');
    console.log('\n📝 Added Quizzes:');
    console.log('- Earthquake Safety and Preparedness (5 questions)');
    console.log('- Flood Safety and Emergency Response (5 questions)');
    console.log('- General Disaster Preparedness (4 questions)');
    
  } catch (error) {
    console.error('❌ Error adding quizzes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  addDisasterQuizzes();
}

module.exports = addDisasterQuizzes;
