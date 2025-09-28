const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    
    if (this.apiKey && this.apiKey.trim() !== '') {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('✅ Gemini AI service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini AI service:', error.message);
        this.genAI = null;
        this.model = null;
      }
    } else {
      console.log('⚠️ Gemini API key not provided, using fallback responses');
    }
  }
  
  // System prompt for disaster preparedness context
  getSystemPrompt() {
    return `You are BEACON AI, a friendly and knowledgeable disaster preparedness assistant designed specifically for schools and colleges. Your role is to educate students about disaster preparedness, response, and safety measures in an engaging, easy-to-understand manner.

Key Guidelines:
1. Always maintain an educational, supportive, and encouraging tone
2. Provide practical, actionable advice suitable for students
3. Focus on disaster preparedness topics: earthquakes, floods, fires, cyclones, evacuation procedures, first aid, emergency planning
4. Use simple language appropriate for school/college students
5. Include relevant examples and scenarios when helpful
6. Encourage preparedness without causing panic or fear
7. When unsure about specific local emergency procedures, recommend contacting local authorities
8. Promote the importance of disaster drills and emergency planning

Topics you can help with:
- Earthquake safety and preparedness
- Flood response and safety measures
- Fire safety and evacuation procedures
- Cyclone/hurricane preparedness
- First aid basics
- Emergency kit preparation
- School/college emergency procedures
- General disaster preparedness tips
- Mental health during disasters

If asked about topics outside disaster preparedness, politely redirect the conversation back to safety and preparedness topics.`;
  }
  
  async generateResponse(userMessage, conversationHistory = []) {
    try {
      if (!this.model) {
        throw new Error('Gemini API key not configured');
      }
      
      // Build conversation context
      let prompt = this.getSystemPrompt() + '\n\n';
      
      // Add conversation history
      if (conversationHistory.length > 0) {
        prompt += 'Previous conversation:\n';
        conversationHistory.forEach(msg => {
          prompt += `${msg.role === 'user' ? 'Student' : 'BEACON AI'}: ${msg.content}\n`;
        });
        prompt += '\n';
      }
      
      prompt += `Student: ${userMessage}\nBEACON AI:`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        response: text,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Fallback responses for common disaster preparedness questions
      const fallbackResponse = this.getFallbackResponse(userMessage);
      
      return {
        success: true, // treat fallback as a successful response for UX
        response: fallbackResponse,
        error: error.message,
        timestamp: new Date()
      };
    }
  }
  
  getFallbackResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Earthquake-related fallback
    if (message.includes('earthquake')) {
      return `I'm currently unable to access my full knowledge base, but here are essential earthquake safety tips:

🏠 **During an Earthquake:**
- Drop, Cover, and Hold On
- Get under a sturdy desk or table
- Stay away from windows and heavy objects
- If outdoors, move away from buildings and power lines

📋 **Earthquake Preparedness:**
- Create an emergency kit with water, food, flashlight, and first aid supplies
- Practice earthquake drills regularly
- Identify safe spots in each room
- Secure heavy furniture and objects

For detailed local emergency procedures, please contact your local disaster management authority.`;
    }
    
    // Fire safety fallback
    if (message.includes('fire')) {
      return `Here are essential fire safety guidelines:

🔥 **Fire Safety Basics:**
- Know your evacuation routes
- Never use elevators during a fire
- Stay low to avoid smoke inhalation
- Feel doors before opening them
- Call emergency services immediately

🏫 **School Fire Safety:**
- Participate in fire drills seriously
- Know the location of fire extinguishers
- Report fire hazards to authorities
- Have a meeting point outside the building

Remember: Get out, stay out, and call for help!`;
    }
    
    // Flood-related fallback
    if (message.includes('flood')) {
      return `Flood safety information:

🌊 **Flood Preparedness:**
- Know your area's flood risk
- Create an evacuation plan
- Keep important documents in waterproof containers
- Have an emergency kit ready

⚠️ **During a Flood:**
- Move to higher ground immediately
- Avoid walking or driving through flood water
- Stay informed through official weather updates
- Never attempt to cross flowing water

Remember: Turn Around, Don't Drown!`;
    }
    
    // General preparedness fallback
    return `I'm currently experiencing technical difficulties, but I'm here to help with disaster preparedness! 

🎯 **General Emergency Preparedness:**
- Build an emergency kit (water, food, flashlight, first aid)
- Make a family/roommate communication plan
- Stay informed about local hazards
- Practice emergency drills regularly
- Keep important documents safe

📱 **Stay Connected:**
- Follow local emergency management on social media
- Sign up for emergency alerts
- Keep emergency contacts handy

For specific questions about disaster preparedness, please try asking again or contact your local emergency management office.`;
  }
  
  // Generate quiz questions based on topic
  async generateQuizQuestions(topic, difficulty = 'medium', count = 5) {
    try {
      if (!this.model) {
        throw new Error('Gemini API key not configured');
      }
      
      const prompt = `Generate ${count} multiple-choice questions about ${topic} disaster preparedness for ${difficulty} difficulty level. 

Format each question as JSON with this structure:
{
  "question": "Question text",
  "options": [
    {"text": "Option A", "isCorrect": false},
    {"text": "Option B", "isCorrect": true},
    {"text": "Option C", "isCorrect": false},
    {"text": "Option D", "isCorrect": false}
  ],
  "explanation": "Brief explanation of the correct answer",
  "points": 10
}

Topics should be educational and appropriate for school/college students. Focus on practical safety knowledge.

Return only a JSON array of questions, no additional text.`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const questions = JSON.parse(text);
      
      return {
        success: true,
        questions,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Quiz generation error:', error);
      return {
        success: false,
        error: error.message,
        questions: []
      };
    }
  }
  
  // Generate educational content
  async generateEducationalContent(topic, contentType = 'article') {
    try {
      if (!this.model) {
        throw new Error('Gemini API key not configured');
      }
      
      let prompt = `Create educational content about ${topic} disaster preparedness for school/college students.`;
      
      if (contentType === 'article') {
        prompt += ` Write a comprehensive but easy-to-understand article with practical tips and actionable advice. Include sections like preparation, during the disaster, and after the disaster. Make it engaging for young adults.`;
      } else if (contentType === 'tips') {
        prompt += ` Provide a list of practical tips and safety measures. Format as bullet points for easy reading.`;
      } else if (contentType === 'checklist') {
        prompt += ` Create a checklist format with items students can actually follow and check off.`;
      }
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        content: text,
        type: contentType,
        topic: topic,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Content generation error:', error);
      return {
        success: false,
        error: error.message,
        content: null
      };
    }
  }
}

module.exports = new GeminiService();
