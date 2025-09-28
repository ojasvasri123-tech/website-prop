const express = require('express');
const { auth, optionalAuth } = require('../middleware/auth');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Store conversation history in memory (in production, use Redis or database)
const conversationHistory = new Map();

// Chat with AI assistant
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    // Get or create conversation history
    const sessionId = conversationId || (req.user ? req.user._id.toString() : 'anonymous');
    let history = conversationHistory.get(sessionId) || [];
    
    // Limit conversation history to last 10 messages to manage token usage
    if (history.length > 10) {
      history = history.slice(-10);
    }
    
    // Generate AI response
    const aiResponse = await geminiService.generateResponse(message, history);
    
    // Update conversation history
    history.push(
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: aiResponse.response, timestamp: aiResponse.timestamp }
    );
    conversationHistory.set(sessionId, history);
    
    // Clean up old conversations (keep only last 100 conversations)
    if (conversationHistory.size > 100) {
      const oldestKey = conversationHistory.keys().next().value;
      conversationHistory.delete(oldestKey);
    }
    
    res.json({
      response: aiResponse.response,
      conversationId: sessionId,
      timestamp: aiResponse.timestamp,
      success: aiResponse.success
    });
    
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ 
      message: 'I apologize, but I\'m experiencing technical difficulties. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get conversation history
router.get('/history/:conversationId', optionalAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Only allow users to access their own conversation history
    if (req.user && conversationId !== req.user._id.toString() && conversationId !== 'anonymous') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const history = conversationHistory.get(conversationId) || [];
    
    res.json({
      conversationId,
      history,
      messageCount: history.length
    });
    
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear conversation history
router.delete('/history/:conversationId', optionalAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Only allow users to clear their own conversation history
    if (req.user && conversationId !== req.user._id.toString() && conversationId !== 'anonymous') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    conversationHistory.delete(conversationId);
    
    res.json({ message: 'Conversation history cleared successfully' });
    
  } catch (error) {
    console.error('History clear error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate quiz questions using AI
router.post('/generate-quiz', auth, async (req, res) => {
  try {
    // Only allow admins to generate quiz questions
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { topic, difficulty = 'medium', count = 5 } = req.body;
    
    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }
    
    const result = await geminiService.generateQuizQuestions(topic, difficulty, count);
    
    if (!result.success) {
      return res.status(500).json({ 
        message: 'Failed to generate quiz questions',
        error: result.error
      });
    }
    
    res.json({
      message: 'Quiz questions generated successfully',
      questions: result.questions,
      topic,
      difficulty,
      count: result.questions.length
    });
    
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ message: 'Server error during quiz generation' });
  }
});

// Generate educational content using AI
router.post('/generate-content', auth, async (req, res) => {
  try {
    // Only allow admins to generate content
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { topic, contentType = 'article' } = req.body;
    
    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }
    
    const validContentTypes = ['article', 'tips', 'checklist'];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({ 
        message: 'Invalid content type. Must be one of: ' + validContentTypes.join(', ')
      });
    }
    
    const result = await geminiService.generateEducationalContent(topic, contentType);
    
    if (!result.success) {
      return res.status(500).json({ 
        message: 'Failed to generate educational content',
        error: result.error
      });
    }
    
    res.json({
      message: 'Educational content generated successfully',
      content: result.content,
      topic: result.topic,
      type: result.type,
      timestamp: result.timestamp
    });
    
  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({ message: 'Server error during content generation' });
  }
});

// Get suggested questions/prompts
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = [
      {
        category: 'Earthquake Safety',
        questions: [
          'What should I do during an earthquake?',
          'How can I prepare my dorm room for earthquakes?',
          'What items should be in an earthquake emergency kit?',
          'How do I practice earthquake drills effectively?'
        ]
      },
      {
        category: 'Fire Safety',
        questions: [
          'What are the steps for fire evacuation?',
          'How can I prevent fires in my college dorm?',
          'What should I do if I smell smoke?',
          'How do fire extinguishers work?'
        ]
      },
      {
        category: 'Flood Preparedness',
        questions: [
          'How can I prepare for flooding?',
          'What should I do if my area floods?',
          'How do I create a flood evacuation plan?',
          'What documents should I protect from floods?'
        ]
      },
      {
        category: 'General Emergency',
        questions: [
          'What should be in my emergency kit?',
          'How do I create an emergency communication plan?',
          'What are the most important emergency contacts?',
          'How can I help others during disasters?'
        ]
      },
      {
        category: 'First Aid',
        questions: [
          'What are basic first aid steps?',
          'How do I treat minor cuts and burns?',
          'What should I do if someone is unconscious?',
          'How do I perform CPR basics?'
        ]
      }
    ];
    
    res.json({ suggestions });
    
  } catch (error) {
    console.error('Suggestions fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check for AI service
router.get('/health', async (req, res) => {
  try {
    const isConfigured = !!process.env.GEMINI_API_KEY;
    
    res.json({
      status: 'OK',
      aiConfigured: isConfigured,
      conversationsActive: conversationHistory.size,
      message: isConfigured 
        ? 'AI chatbot is ready to help with disaster preparedness questions!'
        : 'AI chatbot is running in fallback mode (API key not configured)'
    });
    
  } catch (error) {
    console.error('Chatbot health check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
