const express = require('express');
const { auth, optionalAuth } = require('../middleware/auth');
const { Quiz, QuizAttempt } = require('../models/Quiz');
const User = require('../models/User');

const router = express.Router();

// Get all available quizzes
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 12, category, difficulty, search } = req.query;
    
    const query = { isActive: true };
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }
    
    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-questions.explanation'); // Hide explanations in list view
    
    const total = await Quiz.countDocuments(query);
    
    // If user is authenticated, check which quizzes they've attempted
    let attemptedQuizIds = [];
    if (req.user) {
      attemptedQuizIds = await QuizAttempt.find({ user: req.user._id }).distinct('quiz');
    }
    
    const quizzesWithStatus = quizzes.map(quiz => ({
      ...quiz.toObject(),
      isAttempted: attemptedQuizIds.includes(quiz._id.toString()),
      questionsCount: quiz.questions.length
    }));
    
    res.json({
      quizzes: quizzesWithStatus,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Quizzes fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get quiz details (for starting a quiz)
router.get('/:quizId', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId)
      .populate('createdBy', 'name');
    
    if (!quiz || !quiz.isActive) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if user has already attempted this quiz
    const existingAttempt = await QuizAttempt.findOne({
      user: req.user._id,
      quiz: quiz._id
    });
    
    if (existingAttempt) {
      return res.status(400).json({ 
        message: 'You have already attempted this quiz',
        attempt: existingAttempt
      });
    }
    
    // Return quiz without correct answers and explanations
    const quizForUser = {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty,
      timeLimit: quiz.timeLimit,
      totalPoints: quiz.totalPoints,
      createdBy: quiz.createdBy,
      questions: quiz.questions.map((q, index) => ({
        _id: q._id,
        question: q.question,
        options: q.options.map(opt => ({ text: opt.text })), // Remove isCorrect
        points: q.points,
        index: index
      }))
    };
    
    res.json({ quiz: quizForUser });
    
  } catch (error) {
    console.error('Quiz fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit quiz attempt
router.post('/:quizId/submit', auth, async (req, res) => {
  try {
    const { answers, timeSpent } = req.body; // answers: [{ questionIndex, selectedOption, timeSpent }]
    
    console.log('Quiz submission attempt:', {
      quizId: req.params.quizId,
      userId: req.user._id,
      answersCount: answers?.length,
      timeSpent
    });
    
    // Validate quiz ID format
    if (!req.params.quizId || !req.params.quizId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid quiz ID format' });
    }
    
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz || !quiz.isActive) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if user has already attempted this quiz
    const existingAttempt = await QuizAttempt.findOne({
      user: req.user._id,
      quiz: quiz._id
    });
    
    if (existingAttempt) {
      return res.status(400).json({ message: 'You have already attempted this quiz' });
    }
    
    // Validate answers array
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Invalid answers format' });
    }
    
    // Validate and score answers
    let score = 0;
    let correctAnswers = 0;
    let bonusPoints = 0;
    
    const scoredAnswers = answers.map(answer => {
      const question = quiz.questions[answer.questionIndex];
      if (!question) return { ...answer, isCorrect: false };
      
      const correctOptionIndex = question.options.findIndex(opt => opt.isCorrect);
      const isCorrect = answer.selectedOption === correctOptionIndex;
      
      if (isCorrect) {
        score += question.points;
        correctAnswers++;
        
        // Bonus points for quick answers (if answered in less than 30 seconds)
        if (answer.timeSpent && answer.timeSpent < 30) {
          bonusPoints += 2;
        }
      }
      
      return {
        ...answer,
        isCorrect
      };
    });
    
    const totalPoints = score + bonusPoints;
    const percentage = Math.round((score / quiz.totalPoints) * 100);
    
    // Create quiz attempt
    const attempt = new QuizAttempt({
      user: req.user._id,
      quiz: quiz._id,
      answers: scoredAnswers,
      score,
      percentage,
      timeSpent,
      bonusPoints,
      totalPoints
    });
    
    await attempt.save();
    
    // Update user statistics
    const user = await User.findById(req.user._id);
    user.quizStats.totalQuizzes += 1;
    user.quizStats.correctAnswers += correctAnswers;
    user.quizStats.averageScore = Math.round(
      ((user.quizStats.averageScore * (user.quizStats.totalQuizzes - 1)) + percentage) / user.quizStats.totalQuizzes
    );
    
    // Add points to user
    await user.addPoints(totalPoints);
    
    // Check for new badges
    const newBadges = user.checkForNewBadges();
    await user.save();
    
    // Update quiz statistics
    quiz.stats.totalAttempts += 1;
    quiz.stats.averageScore = Math.round(
      ((quiz.stats.averageScore * (quiz.stats.totalAttempts - 1)) + percentage) / quiz.stats.totalAttempts
    );
    await quiz.save();
    
    // Return results with correct answers and explanations
    const results = {
      attempt: {
        score,
        percentage,
        totalPoints,
        bonusPoints,
        timeSpent,
        correctAnswers,
        totalQuestions: quiz.questions.length
      },
      answers: scoredAnswers.map(answer => {
        const question = quiz.questions[answer.questionIndex];
        const correctOptionIndex = question.options.findIndex(opt => opt.isCorrect);
        
        return {
          ...answer,
          correctAnswer: correctOptionIndex,
          explanation: question.explanation,
          question: question.question,
          options: question.options.map(opt => opt.text)
        };
      }),
      newBadges,
      userStats: {
        totalPoints: user.totalPoints,
        level: user.level,
        newLevel: user.level > req.user.level
      }
    };
    
    res.status(201).json({
      message: 'Quiz submitted successfully',
      results
    });
    
  } catch (error) {
    console.error('Quiz submission error:', error);
    
    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ID format provided' });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid data provided', details: error.message });
    }
    
    res.status(500).json({ message: 'Server error during quiz submission', error: error.message });
  }
});

// Get quiz attempt details
router.get('/:quizId/attempt', auth, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findOne({
      user: req.user._id,
      quiz: req.params.quizId
    }).populate('quiz', 'title category difficulty');
    
    if (!attempt) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }
    
    res.json({ attempt });
    
  } catch (error) {
    console.error('Quiz attempt fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get quiz leaderboard
router.get('/:quizId/leaderboard', optionalAuth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const attempts = await QuizAttempt.find({ quiz: req.params.quizId })
      .populate('user', 'name institution')
      .sort({ totalPoints: -1, timeSpent: 1 }) // Higher points first, then faster time
      .limit(limit * 1);
    
    const leaderboard = attempts.map((attempt, index) => ({
      rank: index + 1,
      user: attempt.user,
      score: attempt.score,
      percentage: attempt.percentage,
      totalPoints: attempt.totalPoints,
      timeSpent: attempt.timeSpent,
      completedAt: attempt.completedAt
    }));
    
    res.json({ leaderboard });
    
  } catch (error) {
    console.error('Quiz leaderboard fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get quiz statistics (for admins)
router.get('/:quizId/stats', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Only allow quiz creator or admin to view detailed stats
    if (quiz.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const attempts = await QuizAttempt.find({ quiz: quiz._id })
      .populate('user', 'name institution');
    
    // Calculate detailed statistics
    const stats = {
      totalAttempts: attempts.length,
      averageScore: quiz.stats.averageScore,
      highestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0,
      lowestScore: attempts.length > 0 ? Math.min(...attempts.map(a => a.percentage)) : 0,
      averageTime: attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.timeSpent, 0) / attempts.length) : 0,
      passRate: attempts.length > 0 ? Math.round((attempts.filter(a => a.percentage >= 60).length / attempts.length) * 100) : 0,
      questionStats: quiz.questions.map((question, index) => {
        const questionAttempts = attempts.filter(a => a.answers[index]);
        const correctCount = questionAttempts.filter(a => a.answers[index].isCorrect).length;
        
        return {
          question: question.question,
          correctAnswers: correctCount,
          totalAnswers: questionAttempts.length,
          correctPercentage: questionAttempts.length > 0 ? Math.round((correctCount / questionAttempts.length) * 100) : 0
        };
      })
    };
    
    res.json({ stats, attempts: attempts.slice(0, 10) }); // Return top 10 attempts
    
  } catch (error) {
    console.error('Quiz stats fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get categories and their quiz counts
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Quiz.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({ categories });
    
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
