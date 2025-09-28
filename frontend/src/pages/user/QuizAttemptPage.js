import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Flag,
  Trophy,
  X
} from 'lucide-react';
import { quizAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const QuizAttemptPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const questionStartTimes = useRef({});

  const { data: quizData, isLoading, error } = useQuery(
    ['quiz', id],
    () => quizAPI.getQuiz(id),
    {
      enabled: !quizStarted
    }
  );

  const submitQuizMutation = useMutation(
    ({ id, data }) => quizAPI.submitQuiz(id, data),
    {
      onSuccess: (response) => {
        toast.success('Quiz submitted successfully!');
        navigate(`/app/quizzes/${id}`, { 
          state: { results: response.results } 
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit quiz');
      }
    }
  );

  const quiz = quizData?.quiz;

  // Initialize timer when quiz starts
  useEffect(() => {
    if (quizStarted && quiz) {
      setTimeLeft(quiz.timeLimit);
      startTimeRef.current = Date.now();
      questionStartTimes.current[0] = Date.now();
      
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz(true); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [quizStarted, quiz]);

  // Prevent page refresh/navigation during quiz
  useEffect(() => {
    if (quizStarted) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = '';
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [quizStarted]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      questionStartTimes.current[nextQuestion] = Date.now();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleQuestionJump = (questionIndex) => {
    setCurrentQuestion(questionIndex);
    if (!questionStartTimes.current[questionIndex]) {
      questionStartTimes.current[questionIndex] = Date.now();
    }
  };

  const handleSubmitQuiz = (autoSubmit = false) => {
    if (!autoSubmit && Object.keys(answers).length < quiz.questions.length) {
      if (!window.confirm('You haven\'t answered all questions. Are you sure you want to submit?')) {
        return;
      }
    }

    // Calculate time spent on each question
    const formattedAnswers = quiz.questions.map((question, index) => {
      const questionStartTime = questionStartTimes.current[index] || startTimeRef.current;
      const questionEndTime = index === currentQuestion ? Date.now() : (questionStartTimes.current[index + 1] || Date.now());
      const timeSpent = Math.floor((questionEndTime - questionStartTime) / 1000);

      return {
        questionIndex: index,
        selectedOption: answers[index] ?? -1,
        timeSpent: Math.max(timeSpent, 1)
      };
    });

    const totalTimeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

    submitQuizMutation.mutate({
      id,
      data: {
        answers: formattedAnswers,
        timeSpent: totalTimeSpent
      }
    });

    setShowConfirmSubmit(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading quiz..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to load quiz
          </h3>
          <p className="text-gray-600 mb-4">
            {error.response?.data?.message || 'Please try again later'}
          </p>
          <button
            onClick={() => navigate('/app/quizzes')}
            className="btn-primary"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Pre-quiz screen
  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-8 w-8 text-primary-600" />
              </div>
              
              <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">
                Ready to start?
              </h1>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h2 className="font-semibold text-gray-900 mb-4">{quiz.title}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium text-gray-900 ml-2">
                      {quiz.questions.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Time Limit:</span>
                    <span className="font-medium text-gray-900 ml-2">
                      {Math.floor(quiz.timeLimit / 60)} minutes
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Points:</span>
                    <span className="font-medium text-gray-900 ml-2">
                      {quiz.totalPoints}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-medium text-gray-900 ml-2 capitalize">
                      {quiz.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-left bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Important Notes:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You can only attempt this quiz once</li>
                  <li>• Make sure you have a stable internet connection</li>
                  <li>• The quiz will auto-submit when time runs out</li>
                  <li>• You can navigate between questions freely</li>
                </ul>
              </div>

              <button
                onClick={handleStartQuiz}
                className="btn-primary btn-lg w-full"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {quiz.title}
              </h1>
              <div className="text-sm text-gray-500">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                timeLeft <= 60 ? 'bg-red-100 text-red-800' : 
                timeLeft <= 300 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-green-100 text-green-800'
              }`}>
                <Clock className="h-4 w-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
              
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="btn-primary btn-sm"
                disabled={submitQuizMutation.isLoading}
              >
                <Flag className="h-4 w-4 mr-1" />
                Submit
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{answeredCount} answered</span>
              <span>{quiz.questions.length - answeredCount} remaining</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="card-body">
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex-1">
                      {currentQ.question}
                    </h2>
                    <div className="ml-4 text-sm text-gray-500">
                      {currentQ.points} points
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentQ.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion, index)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        answers[currentQuestion] === index
                          ? 'border-primary-500 bg-primary-50 text-primary-900'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          answers[currentQuestion] === index
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300'
                        }`}>
                          {answers[currentQuestion] === index && (
                            <CheckCircle className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <span className="flex-1">{option.text}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestion === 0}
                    className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </button>
                  
                  <div className="text-sm text-gray-500">
                    {answers[currentQuestion] !== undefined ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Answered
                      </span>
                    ) : (
                      <span className="text-gray-400">Not answered</span>
                    )}
                  </div>

                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestion === quiz.questions.length - 1}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Questions</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                  {quiz.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionJump(index)}
                      className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                        index === currentQuestion
                          ? 'bg-primary-600 text-white'
                          : answers[index] !== undefined
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500 space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-primary-600 rounded"></div>
                      <span>Current</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                      <span>Not answered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Submit Quiz?
              </h3>
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to submit your quiz? You won't be able to change your answers after submission.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Questions answered:</span>
                    <span className="font-medium">{answeredCount} of {quiz.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time remaining:</span>
                    <span className="font-medium">{formatTime(timeLeft)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="btn-outline flex-1"
              >
                Continue Quiz
              </button>
              <button
                onClick={() => handleSubmitQuiz()}
                disabled={submitQuizMutation.isLoading}
                className="btn-primary flex-1"
              >
                {submitQuizMutation.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Quiz'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizAttemptPage;
