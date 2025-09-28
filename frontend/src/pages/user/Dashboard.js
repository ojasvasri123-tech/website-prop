import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  BookOpen, 
  Trophy, 
  AlertTriangle, 
  Calendar, 
  Users, 
  MessageCircle,
  TrendingUp,
  Award,
  Clock,
  MapPin,
  ArrowRight,
  Play
} from 'lucide-react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  
  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    userAPI.getDashboard,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load dashboard
          </h3>
          <p className="text-gray-600">
            Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  const {
    user: userData,
    recentResources = [],
    activeAlerts = [],
    upcomingDrills = [],
    availableQuizzes = [],
    recentAttempts = [],
    recentCommunityPosts = []
  } = dashboardData || {};


  const quickActions = [
    {
      title: 'Browse Resources',
      description: 'Access learning materials and guides',
      icon: BookOpen,
      href: '/app/resources',
      color: 'bg-blue-500',
      count: recentResources.length
    },
    {
      title: 'Take Quiz',
      description: 'Test your knowledge and earn points',
      icon: Trophy,
      href: '/app/quizzes',
      color: 'bg-yellow-500',
      count: availableQuizzes.length
    },
    {
      title: 'View Alerts',
      description: 'Check disaster alerts in your area',
      icon: AlertTriangle,
      href: '/app/alerts',
      color: 'bg-red-500',
      count: activeAlerts.length
    },
    {
      title: 'Chat with AI',
      description: 'Get instant help from our AI assistant',
      icon: MessageCircle,
      href: '/app/chatbot',
      color: 'bg-green-500',
      count: null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-primary rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">
                  Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-blue-100 mb-4">
                  Ready to continue your disaster preparedness journey?
                </p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4" />
                    <span>Level {userData?.level || user?.level}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4" />
                    <span>{userData?.totalPoints || user?.totalPoints} points</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>#{userData?.leaderboardPosition || 'N/A'} on leaderboard</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.href}
                className="card-hover group"
              >
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {action.count !== null && (
                      <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                        {action.count}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Resources */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Resources
                  </h2>
                  <Link
                    to="/app/resources"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="card-body">
                {recentResources.length > 0 ? (
                  <div className="space-y-4">
                    {recentResources.slice(0, 4).map((resource) => (
                      <div key={resource._id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/app/resources/${resource._id}`}
                            className="text-sm font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
                          >
                            {resource.title}
                          </Link>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {resource.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                            <span className="capitalize">{resource.type}</span>
                            <span>{resource.views} views</span>
                            <span className="capitalize">{resource.category}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No resources available yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Alerts */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                    Active Alerts
                  </h3>
                  <Link
                    to="/app/alerts"
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="card-body">
                {activeAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {activeAlerts.slice(0, 3).map((alert) => (
                      <div key={alert._id} className="border-l-4 border-red-400 pl-3">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {alert.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`badge ${
                            alert.severity === 'critical' ? 'badge-danger' :
                            alert.severity === 'high' ? 'badge-warning' :
                            'badge-gray'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            {alert.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No active alerts</p>
                  </div>
                )}
              </div>
            </div>

            {/* Available Quizzes */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                    Available Quizzes
                  </h3>
                  <Link
                    to="/app/quizzes"
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="card-body">
                {availableQuizzes.length > 0 ? (
                  <div className="space-y-3">
                    {availableQuizzes.slice(0, 3).map((quiz) => (
                      <div key={quiz._id} className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {quiz.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-2">
                            <span className="capitalize">{quiz.category}</span>
                            <span>•</span>
                            <span className="capitalize">{quiz.difficulty}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{Math.floor(quiz.timeLimit / 60)}m</span>
                          </div>
                        </div>
                        <Link
                          to={`/app/quizzes/${quiz._id}`}
                          className="inline-flex items-center text-xs text-primary-600 hover:text-primary-700 mt-2"
                        >
                          Take Quiz
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No quizzes available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Drills */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 text-indigo-500 mr-2" />
                    Upcoming Drills
                  </h3>
                  <Link
                    to="/app/drills"
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="card-body">
                {upcomingDrills.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingDrills.map((drill) => (
                      <div key={drill._id} className="p-3 bg-indigo-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {drill.title}
                        </h4>
                        <div className="flex items-center text-xs text-gray-600 space-x-2">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(drill.scheduledDate).toLocaleDateString()}
                          </span>
                          <MapPin className="h-3 w-3 ml-2" />
                          <span>{drill.venue}</span>
                        </div>
                        <span className="inline-block mt-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full capitalize">
                          {drill.type}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No upcoming drills</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Community Posts */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="h-4 w-4 text-green-500 mr-2" />
                  Recent Discussions
                </h3>
                <Link
                  to="/app/community"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="card-body">
              {recentCommunityPosts.length > 0 ? (
                <div className="space-y-3">
                  {recentCommunityPosts.slice(0, 3).map((post) => (
                    <div key={post._id} className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                        {post.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>By {post.author?.name}</span>
                        <div className="flex items-center space-x-2">
                          <span>{post.likes?.length || 0} likes</span>
                          <span>{post.comments?.length || 0} comments</span>
                        </div>
                      </div>
                      <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full capitalize">
                        {post.category}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent discussions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
