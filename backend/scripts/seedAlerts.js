const mongoose = require('mongoose');
const Alert = require('../models/Alert');
require('dotenv').config();

// Sample alert data
const sampleAlerts = [
  {
    title: "Heavy Rainfall Warning - Mumbai",
    description: "The India Meteorological Department has issued a heavy rainfall warning for Mumbai and surrounding areas. Expect 100-200mm of rainfall in the next 24 hours.",
    type: "flood",
    severity: "high",
    source: "Manual",
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
      "Monitor local news for updates",
      "Avoid driving through flooded roads"
    ],
    emergencyContacts: [
      { name: "Mumbai Fire Brigade", phone: "101" },
      { name: "Mumbai Police", phone: "100" },
      { name: "Disaster Management", phone: "1078" }
    ],
    issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours from now
    priority: 8,
    isActive: true,
    isVerified: true
  },
  {
    title: "Earthquake Alert - Delhi NCR",
    description: "A moderate earthquake of magnitude 4.2 was recorded near Delhi. No immediate damage reported, but residents should remain cautious.",
    type: "earthquake",
    severity: "medium",
    source: "NDMA",
    sourceUrl: "https://seismo.gov.in/",
    affectedAreas: [
      { city: "New Delhi", state: "Delhi" },
      { city: "Gurgaon", state: "Haryana" },
      { city: "Noida", state: "Uttar Pradesh" },
      { city: "Faridabad", state: "Haryana" }
    ],
    instructions: [
      "Check for any structural damage in buildings",
      "Be prepared for aftershocks",
      "Keep emergency kit ready",
      "Avoid using elevators temporarily",
      "Stay away from damaged structures"
    ],
    emergencyContacts: [
      { name: "Delhi Fire Service", phone: "101", type: "fire" },
      { name: "Delhi Police", phone: "100", type: "police" },
      { name: "Emergency Services", phone: "112", type: "medical" }
    ],
    issuedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    priority: 6,
    isActive: true,
    isVerified: true
  },
  {
    title: "Cyclone Warning - Chennai Coast",
    description: "Cyclonic storm approaching Chennai coast. Wind speeds expected to reach 80-90 kmph. Fishermen advised not to venture into sea.",
    type: "cyclone",
    severity: "critical",
    source: "IMD",
    sourceUrl: "https://www.imdchennai.gov.in/",
    affectedAreas: [
      { city: "Chennai", state: "Tamil Nadu" },
      { city: "Kanchipuram", state: "Tamil Nadu" },
      { city: "Tiruvallur", state: "Tamil Nadu" }
    ],
    instructions: [
      "Evacuate coastal areas immediately",
      "Secure loose objects and outdoor furniture",
      "Stock up on essential supplies",
      "Avoid travel unless emergency",
      "Stay tuned to official weather updates"
    ],
    emergencyContacts: [
      { name: "Chennai Corporation", phone: "1913", type: "disaster-management" },
      { name: "State Emergency", phone: "1070", type: "disaster-management" },
      { name: "Coast Guard", phone: "1554", type: "disaster-management" }
    ],
    issuedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours from now
    priority: 9,
    isActive: true,
    isVerified: true
  },
  {
    title: "Forest Fire Alert - Bangalore Hills",
    description: "Forest fire reported in the hills surrounding Bangalore. Smoke may affect air quality in the city. Residents advised to stay indoors.",
    type: "fire",
    severity: "medium",
    source: "Local Authority",
    sourceUrl: "https://aranya.gov.in/",
    affectedAreas: [
      { city: "Bangalore", state: "Karnataka" },
      { city: "Mysore", state: "Karnataka" }
    ],
    instructions: [
      "Keep windows and doors closed",
      "Use air purifiers if available",
      "Avoid outdoor activities",
      "Wear masks when going outside",
      "Monitor air quality updates"
    ],
    emergencyContacts: [
      { name: "Fire Department", phone: "101", type: "fire" },
      { name: "Forest Department", phone: "1926", type: "disaster-management" },
      { name: "Emergency Services", phone: "108", type: "medical" }
    ],
    issuedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours from now
    priority: 5,
    isActive: true,
    isVerified: true
  },
  {
    title: "Heat Wave Warning - Rajasthan",
    description: "Severe heat wave conditions prevailing over Rajasthan. Temperature may reach 47°C. Take necessary precautions.",
    type: "weather",
    severity: "high",
    source: "IMD",
    sourceUrl: "https://mausam.imd.gov.in/",
    affectedAreas: [
      { city: "Jaipur", state: "Rajasthan" },
      { city: "Jodhpur", state: "Rajasthan" },
      { city: "Bikaner", state: "Rajasthan" },
      { city: "Udaipur", state: "Rajasthan" }
    ],
    instructions: [
      "Avoid direct sun exposure between 11 AM - 4 PM",
      "Drink plenty of water and fluids",
      "Wear light colored, loose cotton clothes",
      "Use ORS and homemade drinks like lassi",
      "Avoid alcohol and caffeinated drinks"
    ],
    emergencyContacts: [
      { name: "Health Department", phone: "104", type: "medical" },
      { name: "Emergency Services", phone: "108", type: "medical" },
      { name: "Disaster Helpline", phone: "1078", type: "disaster-management" }
    ],
    issuedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    expiresAt: new Date(Date.now() + 40 * 60 * 60 * 1000), // 40 hours from now
    priority: 7,
    isActive: true,
    isVerified: true
  },
  {
    title: "Landslide Warning - Shimla",
    description: "Heavy rains have triggered landslide warnings in Shimla and nearby hill stations. Several roads may be blocked.",
    type: "general",
    severity: "medium",
    source: "Local Authority",
    sourceUrl: "https://hp.gov.in/",
    affectedAreas: [
      { city: "Shimla", state: "Himachal Pradesh" },
      { city: "Manali", state: "Himachal Pradesh" },
      { city: "Dharamshala", state: "Himachal Pradesh" }
    ],
    instructions: [
      "Avoid travel to hilly areas",
      "Stay away from steep slopes",
      "Monitor local traffic updates",
      "Keep emergency supplies ready",
      "Follow evacuation orders if issued"
    ],
    emergencyContacts: [
      { name: "HP Police", phone: "100", type: "police" },
      { name: "Disaster Management", phone: "1077", type: "disaster-management" },
      { name: "Tourist Helpline", phone: "1363", type: "disaster-management" }
    ],
    issuedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    priority: 4,
    isActive: true,
    isVerified: true
  }
];

async function seedAlerts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beacon');
    console.log('Connected to MongoDB');

    // Clear existing alerts
    await Alert.deleteMany({});
    console.log('Cleared existing alerts');

    // Create alerts
    const createdAlerts = await Alert.insertMany(sampleAlerts);
    console.log(`Created ${createdAlerts.length} sample alerts`);

    // Display created alerts
    createdAlerts.forEach((alert, index) => {
      console.log(`${index + 1}. ${alert.title} (${alert.type}, ${alert.severity})`);
      console.log(`   Affected: ${alert.affectedAreas.map(area => `${area.city}, ${area.state}`).join('; ')}`);
    });

    console.log('\n✅ Alert seeding completed successfully!');
    console.log('You can now test the disaster alerts functionality in the web application.');
    
  } catch (error) {
    console.error('❌ Error seeding alerts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding function
if (require.main === module) {
  seedAlerts();
}

module.exports = seedAlerts;
