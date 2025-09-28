import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Trophy, 
  Clock, 
  BookOpen, 
  Users, 
  Play, 
  ArrowLeft,
  Award,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { quizAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const QuizDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: quizData, isLoading, error } = useQuery(
    ['quiz', id],
    () => quizAPI.getQuiz(id)
  );

  const { data: attemptData } = useQuery(
    ['quiz-attempt', id],
    () => quizAPI.getQuizAttempt(id),
    {
      enabled: false // Only fetch if needed
    }
  );

  const { data: leaderboardData } = useQuery(
    ['quiz-leaderboard', id],
    () => quizAPI.getQuizLeaderboard(id, { limit: 10 })
  );

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
            Quiz not found
          </h3>
          <p className="text-gray-600 mb-4">
            The quiz you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/app/quizzes" className="btn-primary">
            Browse Quizzes
          </Link>
        </div>
      </div>
    );
  }

  const quiz = quizData?.quiz;
  const leaderboard = leaderboardData?.leaderboard || [];

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };

  const categoryColors = {
    earthquake: 'bg-orange-100 text-orange-800',
    flood: 'bg-blue-100 text-blue-800',
    fire: 'bg-red-100 text-red-800',
    cyclone: 'bg-purple-100 text-purple-800',
    general: 'bg-gray-100 text-gray-800',
    'first-aid': 'bg-pink-100 text-pink-800'
  };

  const handleStartQuiz = () => {
    navigate(`/app/quizzes/${id}/attempt`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/app/quizzes"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quizzes
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quiz Header */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
                      {quiz.title}
                    </h1>
                    <p className="text-gray-600 mb-4">
                      {quiz.description}
                    </p>
                  </div>
                </div>

                {/* Quiz Meta */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className={`badge ${categoryColors[quiz.category] || 'bg-gray-100 text-gray-800'}`}>
                    {quiz.category}
                  </span>
                  <span className={`badge ${difficultyColors[quiz.difficulty]}`}>
                    {quiz.difficulty}
                  </span>
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {quiz.questions.length} questions
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {Math.floor(quiz.timeLimit / 60)} minutes
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Trophy className="h-4 w-4 mr-1" />
                    {quiz.totalPoints} points
                  </div>
                </div>

                {/* Start Quiz Button */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleStartQuiz}
                    className="btn-primary btn-lg flex items-center"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start Quiz
                  </button>
                  <div className="text-sm text-gray-500">
                    You have {Math.floor(quiz.timeLimit / 60)} minutes to complete this quiz
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz Instructions */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">
                  Instructions
                </h2>
              </div>
              <div className="card-body">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Read each question carefully before selecting your answer.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>You have {Math.floor(quiz.timeLimit / 60)} minutes to complete all {quiz.questions.length} questions.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Each question has only one correct answer.</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>You can only attempt this quiz once, so make sure you're ready!</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Bonus points are awarded for quick and accurate answers.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz Topics Preview */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">
                  What You'll Learn
                </h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quiz.questions.slice(0, 6).map((question, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary-600">
                          {index + 1}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {question.question.length > 60 
                          ? `${question.question.substring(0, 60)}...`
                          : question.question
                        }
                      </p>
                    </div>
                  ))}
                  {quiz.questions.length > 6 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>+ {quiz.questions.length - 6} more questions</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quiz Stats */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Quiz Statistics</h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Attempts</span>
                    <span className="font-medium text-gray-900">
                      {quiz.stats?.totalAttempts || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Score</span>
                    <span className="font-medium text-gray-900">
                      {quiz.stats?.averageScore || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="font-medium text-gray-900">
                      {quiz.stats?.completionRate || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard Preview */}
            {leaderboard.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                      Top Performers
                    </h3>
                    <Link
                      to={`/app/quizzes/${id}/leaderboard`}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      View All
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <div key={entry.user._id} className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {entry.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {entry.user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {entry.user.institution}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.percentage}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.totalPoints} pts
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Created By */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Created By</h3>
              </div>
              <div className="card-body">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {quiz.createdBy?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {quiz.createdBy?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Quiz Author
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Quizzes */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">More in {quiz.category}</h3>
              </div>
              <div className="card-body">
                <div className="text-center py-4">
                  <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    More quizzes coming soon!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDetailPage;
