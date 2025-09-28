const mongoose = require('mongoose');
const { Quiz } = require('../models/Quiz');
const User = require('../models/User');
require('dotenv').config();

// Sample quiz data
const sampleQuizzes = [
  {
    title: "Earthquake Preparedness Basics",
    description: "Test your knowledge about earthquake safety measures and emergency procedures.",
    category: "earthquake",
    difficulty: "easy",
    timeLimit: 300, // 5 minutes
    questions: [
      {
        question: "What should you do immediately when you feel an earthquake?",
        options: [
          { text: "Run outside as fast as possible", isCorrect: false },
          { text: "Drop, Cover, and Hold On", isCorrect: true },
          { text: "Stand in a doorway", isCorrect: false },
          { text: "Get under a table and stay there", isCorrect: false }
        ],
        explanation: "The 'Drop, Cover, and Hold On' technique is the recommended immediate response during an earthquake.",
        points: 10
      },
      {
        question: "Which location is safest during an earthquake?",
        options: [
          { text: "Under a sturdy desk or table", isCorrect: true },
          { text: "In a doorway", isCorrect: false },
          { text: "Near a window", isCorrect: false },
          { text: "On an upper floor", isCorrect: false }
        ],
        explanation: "Getting under a sturdy desk or table provides the best protection from falling objects.",
        points: 10
      },
      {
        question: "How long should you keep emergency supplies for?",
        options: [
          { text: "1 day", isCorrect: false },
          { text: "3 days", isCorrect: false },
          { text: "7 days", isCorrect: true },
          { text: "1 month", isCorrect: false }
        ],
        explanation: "It's recommended to keep at least 7 days worth of emergency supplies for each person.",
        points: 10
      },
      {
        question: "What should be included in an earthquake emergency kit?",
        options: [
          { text: "Water, food, flashlight, first aid kit", isCorrect: true },
          { text: "Only water and food", isCorrect: false },
          { text: "Just a flashlight", isCorrect: false },
          { text: "Candles and matches", isCorrect: false }
        ],
        explanation: "A complete emergency kit should include water, non-perishable food, flashlight, first aid supplies, and other essentials.",
        points: 10
      },
      {
        question: "After an earthquake stops, what should you do first?",
        options: [
          { text: "Check for injuries and hazards", isCorrect: true },
          { text: "Immediately leave the building", isCorrect: false },
          { text: "Turn on all lights", isCorrect: false },
          { text: "Call everyone you know", isCorrect: false }
        ],
        explanation: "First priority is to check yourself and others for injuries, then assess for immediate hazards like gas leaks or structural damage.",
        points: 10
      }
    ],
    tags: ["earthquake", "safety", "emergency", "preparedness"]
  },
  {
    title: "Flood Safety and Response",
    description: "Learn about flood risks, safety measures, and emergency response procedures.",
    category: "flood",
    difficulty: "medium",
    timeLimit: 420, // 7 minutes
    questions: [
      {
        question: "How much water can knock you down while walking?",
        options: [
          { text: "6 inches", isCorrect: true },
          { text: "1 foot", isCorrect: false },
          { text: "2 feet", isCorrect: false },
          { text: "3 feet", isCorrect: false }
        ],
        explanation: "Just 6 inches of moving water can knock you down. Never attempt to walk through flood water.",
        points: 15
      },
      {
        question: "What depth of water can float most vehicles?",
        options: [
          { text: "6 inches", isCorrect: false },
          { text: "12 inches", isCorrect: true },
          { text: "18 inches", isCorrect: false },
          { text: "24 inches", isCorrect: false }
        ],
        explanation: "Just 12 inches of rushing water can carry away a vehicle. Turn around, don't drown!",
        points: 15
      },
      {
        question: "If trapped in a flooded car, what should you do?",
        options: [
          { text: "Stay in the car and wait for help", isCorrect: false },
          { text: "Try to drive through the water", isCorrect: false },
          { text: "Get out immediately and move to higher ground", isCorrect: true },
          { text: "Honk the horn continuously", isCorrect: false }
        ],
        explanation: "If your car is trapped in flood water, abandon it immediately and move to higher ground.",
        points: 15
      },
      {
        question: "What is the most dangerous type of flood?",
        options: [
          { text: "River flooding", isCorrect: false },
          { text: "Flash flooding", isCorrect: true },
          { text: "Coastal flooding", isCorrect: false },
          { text: "Urban flooding", isCorrect: false }
        ],
        explanation: "Flash floods are the most dangerous because they develop quickly with little warning and move at high speeds.",
        points: 15
      },
      {
        question: "During a flood warning, you should:",
        options: [
          { text: "Wait to see how bad it gets", isCorrect: false },
          { text: "Evacuate immediately if advised", isCorrect: true },
          { text: "Move valuables to the basement", isCorrect: false },
          { text: "Fill bathtubs with water", isCorrect: false }
        ],
        explanation: "When authorities issue evacuation orders during flood warnings, leave immediately. Don't wait to see how bad it gets.",
        points: 15
      }
    ],
    tags: ["flood", "water", "safety", "evacuation"]
  },
  {
    title: "Fire Safety and Prevention",
    description: "Essential knowledge about fire prevention, detection, and escape procedures.",
    category: "fire",
    difficulty: "easy",
    timeLimit: 360, // 6 minutes
    questions: [
      {
        question: "How often should you test smoke detectors?",
        options: [
          { text: "Once a year", isCorrect: false },
          { text: "Every 6 months", isCorrect: false },
          { text: "Once a month", isCorrect: true },
          { text: "Only when they beep", isCorrect: false }
        ],
        explanation: "Smoke detectors should be tested monthly to ensure they're working properly.",
        points: 10
      },
      {
        question: "If your clothes catch fire, you should:",
        options: [
          { text: "Run to get help", isCorrect: false },
          { text: "Stop, Drop, and Roll", isCorrect: true },
          { text: "Try to remove the clothing", isCorrect: false },
          { text: "Pour water on yourself", isCorrect: false }
        ],
        explanation: "Stop, Drop, and Roll is the correct technique to extinguish flames on clothing.",
        points: 10
      },
      {
        question: "What should you do if you encounter smoke while escaping a fire?",
        options: [
          { text: "Stand up and run quickly", isCorrect: false },
          { text: "Get low and crawl under the smoke", isCorrect: true },
          { text: "Hold your breath and walk normally", isCorrect: false },
          { text: "Cover your face with a wet cloth", isCorrect: false }
        ],
        explanation: "Crawl low under smoke because cleaner air is near the floor.",
        points: 10
      },
      {
        question: "How many escape routes should every home have?",
        options: [
          { text: "One", isCorrect: false },
          { text: "Two", isCorrect: true },
          { text: "Three", isCorrect: false },
          { text: "Four", isCorrect: false }
        ],
        explanation: "Every home should have at least two escape routes from every room in case one is blocked by fire.",
        points: 10
      },
      {
        question: "What type of fire extinguisher is best for kitchen fires?",
        options: [
          { text: "Water", isCorrect: false },
          { text: "Class K (wet chemical)", isCorrect: true },
          { text: "Class A (ordinary combustibles)", isCorrect: false },
          { text: "Class C (electrical)", isCorrect: false }
        ],
        explanation: "Class K fire extinguishers are specifically designed for cooking oil and grease fires in kitchens.",
        points: 10
      }
    ],
    tags: ["fire", "safety", "prevention", "escape"]
  },
  {
    title: "First Aid Fundamentals",
    description: "Basic first aid knowledge that could save lives in emergency situations.",
    category: "first-aid",
    difficulty: "medium",
    timeLimit: 480, // 8 minutes
    questions: [
      {
        question: "What is the correct ratio for chest compressions to rescue breaths in CPR?",
        options: [
          { text: "15:2", isCorrect: false },
          { text: "30:2", isCorrect: true },
          { text: "5:1", isCorrect: false },
          { text: "10:2", isCorrect: false }
        ],
        explanation: "The current CPR guidelines recommend 30 chest compressions followed by 2 rescue breaths.",
        points: 15
      },
      {
        question: "How deep should chest compressions be for an adult?",
        options: [
          { text: "1 inch", isCorrect: false },
          { text: "At least 2 inches", isCorrect: true },
          { text: "3 inches", isCorrect: false },
          { text: "As deep as possible", isCorrect: false }
        ],
        explanation: "Chest compressions should be at least 2 inches deep for adults to be effective.",
        points: 15
      },
      {
        question: "What should you do for severe bleeding?",
        options: [
          { text: "Apply direct pressure", isCorrect: true },
          { text: "Apply a tourniquet immediately", isCorrect: false },
          { text: "Pour hydrogen peroxide on the wound", isCorrect: false },
          { text: "Elevate the wound above the heart", isCorrect: false }
        ],
        explanation: "Direct pressure is the first and most important step to control severe bleeding.",
        points: 15
      },
      {
        question: "Signs of a heart attack include:",
        options: [
          { text: "Chest pain, shortness of breath, nausea", isCorrect: true },
          { text: "Only severe chest pain", isCorrect: false },
          { text: "Sudden loss of consciousness", isCorrect: false },
          { text: "High fever and chills", isCorrect: false }
        ],
        explanation: "Heart attack symptoms can include chest pain, shortness of breath, nausea, and other signs.",
        points: 15
      },
      {
        question: "What is the recovery position used for?",
        options: [
          { text: "Unconscious but breathing victims", isCorrect: true },
          { text: "Victims in cardiac arrest", isCorrect: false },
          { text: "Victims with spinal injuries", isCorrect: false },
          { text: "Victims who are choking", isCorrect: false }
        ],
        explanation: "The recovery position is used for unconscious victims who are still breathing to keep their airway clear.",
        points: 15
      },
      {
        question: "How do you treat a burn?",
        options: [
          { text: "Apply ice directly", isCorrect: false },
          { text: "Use butter or oil", isCorrect: false },
          { text: "Cool with running water", isCorrect: true },
          { text: "Pop any blisters", isCorrect: false }
        ],
        explanation: "Cool burns with running water for 10-20 minutes. Never use ice, butter, or oil.",
        points: 15
      }
    ],
    tags: ["first-aid", "medical", "emergency", "CPR"]
  },
  {
    title: "Cyclone and Hurricane Preparedness",
    description: "Understanding tropical cyclones and how to prepare for and respond to them.",
    category: "cyclone",
    difficulty: "hard",
    timeLimit: 600, // 10 minutes
    questions: [
      {
        question: "What is the eye of a hurricane?",
        options: [
          { text: "The most dangerous part with highest winds", isCorrect: false },
          { text: "A calm area in the center with light winds", isCorrect: true },
          { text: "The area where the storm first forms", isCorrect: false },
          { text: "The outer edge of the storm", isCorrect: false }
        ],
        explanation: "The eye is the calm center of a hurricane with light winds and often clear skies.",
        points: 20
      },
      {
        question: "What wind speed defines a Category 1 hurricane?",
        options: [
          { text: "39-73 mph", isCorrect: false },
          { text: "74-95 mph", isCorrect: true },
          { text: "96-110 mph", isCorrect: false },
          { text: "111-129 mph", isCorrect: false }
        ],
        explanation: "Category 1 hurricanes have sustained winds of 74-95 mph.",
        points: 20
      },
      {
        question: "Storm surge is most dangerous because:",
        options: [
          { text: "It brings heavy rainfall", isCorrect: false },
          { text: "It causes power outages", isCorrect: false },
          { text: "It can cause catastrophic flooding", isCorrect: true },
          { text: "It damages roofs", isCorrect: false }
        ],
        explanation: "Storm surge is the abnormal rise of water generated by a storm's winds and can cause devastating coastal flooding.",
        points: 20
      },
      {
        question: "When should you evacuate for a hurricane?",
        options: [
          { text: "Only when the storm makes landfall", isCorrect: false },
          { text: "When authorities issue evacuation orders", isCorrect: true },
          { text: "When you see the eye of the storm", isCorrect: false },
          { text: "After the storm passes", isCorrect: false }
        ],
        explanation: "Evacuate immediately when authorities issue evacuation orders. Don't wait until the last minute.",
        points: 20
      },
      {
        question: "What should you NOT do during the eye of a hurricane?",
        options: [
          { text: "Stay indoors", isCorrect: false },
          { text: "Go outside to assess damage", isCorrect: true },
          { text: "Continue sheltering in place", isCorrect: false },
          { text: "Monitor weather updates", isCorrect: false }
        ],
        explanation: "Never go outside during the eye of the hurricane. The other side of the storm will hit with winds from the opposite direction.",
        points: 20
      }
    ],
    tags: ["cyclone", "hurricane", "storm", "evacuation", "weather"]
  }
];

async function seedQuizzes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beacon');
    console.log('Connected to MongoDB');

    // Find or create an admin user to be the creator of quizzes
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      // Create a default admin user
      adminUser = new User({
        name: 'System Admin',
        email: 'admin@beacon.edu',
        password: 'admin123', // This will be hashed by the User model
        role: 'admin',
        institution: 'The Beacon System',
        city: 'Admin City',
        state: 'Admin State',
        isActive: true
      });
      await adminUser.save();
      console.log('Created default admin user');
    }

    // Clear existing quizzes
    await Quiz.deleteMany({});
    console.log('Cleared existing quizzes');

    // Create quizzes with the admin user as creator
    const quizzesToCreate = sampleQuizzes.map(quiz => ({
      ...quiz,
      createdBy: adminUser._id,
      stats: {
        totalAttempts: 0,
        averageScore: 0,
        completionRate: 0
      }
    }));

    const createdQuizzes = await Quiz.insertMany(quizzesToCreate);
    console.log(`Created ${createdQuizzes.length} sample quizzes`);

    // Display created quizzes
    createdQuizzes.forEach((quiz, index) => {
      console.log(`${index + 1}. ${quiz.title} (${quiz.category}, ${quiz.difficulty})`);
    });

    console.log('\n✅ Quiz seeding completed successfully!');
    console.log('You can now test the quiz functionality in the web application.');
    
  } catch (error) {
    console.error('❌ Error seeding quizzes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding function
if (require.main === module) {
  seedQuizzes();
}

module.exports = seedQuizzes;
