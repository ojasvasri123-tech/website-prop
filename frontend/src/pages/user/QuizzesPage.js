import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Trophy, 
  Clock, 
  Users, 
  Filter, 
  Search, 
  BookOpen,
  Star,
  Play,
  Award,
  TrendingUp
} from 'lucide-react';
import { quizAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const QuizzesPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    difficulty: '',
    page: 1
  });

  const { data: quizzesData, isLoading, error } = useQuery(
    ['quizzes', filters],
    () => quizAPI.getQuizzes(filters),
    {
      keepPreviousData: true
    }
  );

  const { data: categoriesData } = useQuery(
    'quiz-categories',
    quizAPI.getCategories
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (isLoading && !quizzesData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading quizzes..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load quizzes
          </h3>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  const { quizzes = [], totalPages = 1, currentPage = 1, total = 0 } = quizzesData || {};
  const categories = categoriesData?.categories || [];

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900 flex items-center">
                <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
                Knowledge Quizzes
              </h1>
              <p className="text-gray-600 mt-1">
                Test your disaster preparedness knowledge and earn points
              </p>
            </div>
            <Link
              to="/app/leaderboard"
              className="btn-outline flex items-center"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Leaderboard
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-primary-600 mb-1">{total}</div>
              <div className="text-sm text-gray-600">Available Quizzes</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {quizzes.filter(q => q.isAttempted).length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {categories.length}
              </div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {quizzes.filter(q => !q.isAttempted).length}
              </div>
              <div className="text-sm text-gray-600">New Quizzes</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="form-input pl-10"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="form-select"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category._id.charAt(0).toUpperCase() + category._id.slice(1)} ({category.count})
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="form-select"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              {/* Clear Filters */}
              <button
                onClick={() => setFilters({ search: '', category: '', difficulty: '', page: 1 })}
                className="btn-outline"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Quiz Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading quizzes..." />
          </div>
        ) : quizzes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {quizzes.map((quiz) => (
                <div key={quiz._id} className="card-hover">
                  <div className="card-body">
                    {/* Quiz Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {quiz.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                          {quiz.description}
                        </p>
                      </div>
                      {quiz.isAttempted && (
                        <div className="ml-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Award className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quiz Meta */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span className={`badge ${categoryColors[quiz.category] || 'bg-gray-100 text-gray-800'}`}>
                        {quiz.category}
                      </span>
                      <span className={`badge ${difficultyColors[quiz.difficulty]}`}>
                        {quiz.difficulty}
                      </span>
                    </div>

                    {/* Quiz Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{quiz.questionsCount} questions</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{Math.floor(quiz.timeLimit / 60)}m</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4" />
                        <span>{quiz.totalPoints} pts</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      to={`/app/quizzes/${quiz._id}`}
                      className={`btn w-full flex items-center justify-center ${
                        quiz.isAttempted 
                          ? 'btn-outline' 
                          : 'btn-primary'
                      }`}
                    >
                      {quiz.isAttempted ? (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Results
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Quiz
                        </>
                      )}
                    </Link>

                    {/* Quiz Stats Footer */}
                    {quiz.stats && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{quiz.stats.totalAttempts} attempts</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>{quiz.stats.averageScore}% avg</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded text-sm ${
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No quizzes found
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.category || filters.difficulty
                ? 'Try adjusting your filters to see more results.'
                : 'Check back later for new quizzes!'}
            </p>
            {(filters.search || filters.category || filters.difficulty) && (
              <button
                onClick={() => setFilters({ search: '', category: '', difficulty: '', page: 1 })}
                className="btn-primary"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizzesPage;
