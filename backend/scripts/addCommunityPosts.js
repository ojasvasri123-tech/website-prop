const mongoose = require('mongoose');
const CommunityPost = require('../models/Community');
const User = require('../models/User');
require('dotenv').config();

// Sample community posts to demonstrate functionality
const samplePosts = [
  {
    title: "Essential Items for Your Earthquake Emergency Kit",
    content: "After experiencing the recent earthquake, I wanted to share what I learned about emergency preparedness. Here are the must-have items for your earthquake kit:\n\n1. **Water**: 1 gallon per person per day for at least 7 days\n2. **Non-perishable food**: Canned goods, energy bars, dried fruits\n3. **Flashlight and extra batteries**\n4. **First aid kit** with bandages, antiseptic, medications\n5. **Emergency radio** (battery or hand-crank)\n6. **Important documents** in waterproof container\n7. **Cash** in small bills\n8. **Blankets and warm clothing**\n9. **Tools**: wrench for gas shut-off, multi-tool\n10. **Personal hygiene items**\n\nWhat other items do you think are essential? Share your experiences!",
    type: "tip",
    category: "earthquake",
    tags: ["emergency-kit", "preparedness", "earthquake", "safety", "supplies"]
  },
  {
    title: "How do you stay calm during a disaster?",
    content: "I've been thinking about how important it is to stay calm during emergencies. Panic can make situations much worse and prevent us from thinking clearly.\n\nI've heard that practicing emergency drills regularly can help, but I'm curious about other techniques. Do you have any strategies for staying calm during disasters?\n\nSome things I've tried:\n- Deep breathing exercises\n- Having a clear emergency plan\n- Regular practice of emergency procedures\n- Staying informed but not overwhelmed by news\n\nWhat works for you? Any tips from psychology or personal experience?",
    type: "question",
    category: "general",
    tags: ["mental-health", "stress-management", "emergency-response", "psychology"]
  },
  {
    title: "Flood Experience: Lessons Learned from Last Month's Flooding",
    content: "Our neighborhood experienced severe flooding last month, and I wanted to share what we learned from the experience:\n\n**What Worked Well:**\n- Having sandbags ready made a huge difference\n- Our emergency communication plan helped us stay in touch\n- Moving important items to higher floors beforehand saved a lot\n\n**What We Wish We Had Done:**\n- Should have evacuated earlier when the warning was issued\n- Needed more waterproof storage for documents\n- Emergency radio would have been helpful when power went out\n\n**Unexpected Challenges:**\n- Cell towers went down, making communication difficult\n- Roads became impassable much faster than expected\n- Clean water became scarce within 24 hours\n\nThe community really came together to help each other. It reminded me how important it is to know your neighbors and have local support networks.\n\nHas anyone else dealt with flooding? What did you learn?",
    type: "experience",
    category: "flood",
    tags: ["flood", "community", "lessons-learned", "evacuation", "preparedness"]
  },
  {
    title: "Fire Safety Tips for Apartment Dwellers",
    content: "Living in an apartment building presents unique challenges for fire safety. Here are some tips I've gathered:\n\n**Prevention:**\n- Test smoke detectors monthly\n- Keep fire extinguisher in kitchen\n- Don't overload electrical outlets\n- Be careful with candles and space heaters\n\n**Escape Planning:**\n- Know at least 2 exit routes from your apartment\n- Practice the escape route in the dark\n- Designate a meeting place outside\n- Keep a flashlight by your bed\n\n**Building-Specific Tips:**\n- Know where fire extinguishers and alarms are located\n- Participate in building fire drills\n- Keep stairwells clear (don't use elevators during fire)\n- Report any fire safety concerns to building management\n\nAnyone have additional tips for apartment fire safety?",
    type: "tip",
    category: "fire",
    tags: ["fire-safety", "apartment", "prevention", "escape-plan", "building-safety"]
  },
  {
    title: "Creating a Family Emergency Communication Plan",
    content: "After the recent disasters in our area, my family realized we didn't have a good communication plan. We just created one and wanted to share the process:\n\n**Key Components:**\n1. **Emergency contacts list** - local and out-of-state contacts\n2. **Meeting places** - one near home, one outside neighborhood\n3. **Important phone numbers** - work, school, doctors, insurance\n4. **Social media plan** - which platforms to use for updates\n5. **Document storage** - where important papers are kept\n\n**Tips for Success:**\n- Make sure everyone has a copy (physical and digital)\n- Practice the plan regularly\n- Update it when circumstances change\n- Include pets in your planning\n- Consider special needs of family members\n\nWe laminated wallet-sized cards for everyone with key info. The kids actually enjoyed helping create it, which made them more engaged with emergency preparedness.\n\nWhat does your family communication plan look like?",
    type: "discussion",
    category: "general",
    tags: ["family", "communication", "emergency-planning", "preparedness", "organization"]
  }
];

async function addCommunityPosts() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beacon');
    console.log('✅ Connected to MongoDB');

    // Get different users to assign as authors
    const users = await User.find({}).limit(5);
    if (users.length === 0) {
      console.error('❌ No users found. Please create users first.');
      process.exit(1);
    }

    console.log('🔄 Adding sample community posts...');
    
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i];
      
      // Check if post already exists
      const existingPost = await CommunityPost.findOne({ 
        title: postData.title 
      });
      
      if (existingPost) {
        console.log(`⚠️  Post "${postData.title}" already exists, skipping...`);
        continue;
      }

      // Assign different users as authors
      const authorUser = users[i % users.length];

      const post = new CommunityPost({
        ...postData,
        author: authorUser._id
      });

      await post.save();
      console.log(`✅ Added: "${post.title}" by ${authorUser.email}`);
    }

    console.log('\n🎉 Community posts added successfully!');
    console.log('\n💬 Added Posts:');
    console.log('- Essential Items for Your Earthquake Emergency Kit');
    console.log('- How do you stay calm during a disaster?');
    console.log('- Flood Experience: Lessons Learned');
    console.log('- Fire Safety Tips for Apartment Dwellers');
    console.log('- Creating a Family Emergency Communication Plan');
    
  } catch (error) {
    console.error('❌ Error adding community posts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  addCommunityPosts();
}

module.exports = addCommunityPosts;
