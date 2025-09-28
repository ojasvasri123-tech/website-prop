import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  Users, 
  BookOpen, 
  Trophy, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  Activity,
  Upload,
  Youtube,
  FileText,
  Plus
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [uploadType, setUploadType] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: dashboardData, isLoading, error } = useQuery(
    'admin-dashboard',
    adminAPI.getDashboard
  );

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Handle quick upload
  const handleQuickUpload = async () => {
    if (!uploadType) {
      toast.error('Please select an upload type');
      return;
    }

    if (uploadType === 'youtube' && !youtubeUrl) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    if (uploadType === 'pdf' && !selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      
      if (uploadType === 'youtube') {
        const youtubeId = extractYouTubeId(youtubeUrl);
        if (!youtubeId) {
          toast.error('Invalid YouTube URL');
          setUploading(false);
          return;
        }

        formData.append('title', 'YouTube Video'); // Default title
        formData.append('description', 'Uploaded from admin dashboard');
        formData.append('type', 'video');
        formData.append('category', 'general');
        formData.append('externalUrl', youtubeUrl);
        formData.append('youtubeId', youtubeId);
        formData.append('difficulty', 'beginner');
        formData.append('targetAudience', 'both');
      } else if (uploadType === 'pdf') {
        formData.append('title', selectedFile.name.replace('.pdf', ''));
        formData.append('description', 'PDF uploaded from admin dashboard');
        formData.append('type', 'pdf');
        formData.append('category', 'general');
        formData.append('file', selectedFile);
        formData.append('difficulty', 'beginner');
        formData.append('targetAudience', 'both');
      }

      await adminAPI.uploadResource(formData);
      toast.success('Resource uploaded successfully!');
      
      // Reset form
      setShowQuickUpload(false);
      setUploadType('');
      setYoutubeUrl('');
      setSelectedFile(null);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload resource');
    } finally {
      setUploading(false);
    }
  };

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
          <Activity className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load dashboard
          </h3>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const { stats, recentActivities } = dashboardData || {};

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Resources',
      value: stats?.totalResources || 0,
      icon: BookOpen,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Quizzes',
      value: stats?.totalQuizzes || 0,
      icon: Trophy,
      color: 'bg-yellow-500',
      change: '+15%'
    },
    {
      title: 'Active Alerts',
      value: stats?.activeAlerts || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: '-5%'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Overview of The Beacon platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-xs text-green-600">{stat.change}</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Upload Section */}
        <div className="mb-8">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Upload className="h-5 w-5 mr-2 text-blue-600" />
                Quick Upload
              </h2>
              <button
                onClick={() => setShowQuickUpload(!showQuickUpload)}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showQuickUpload ? 'Cancel' : 'Upload Resource'}
              </button>
            </div>
            
            {showQuickUpload && (
              <div className="card-body border-t">
                <div className="space-y-4">
                  {/* Upload Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setUploadType('youtube')}
                        className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                          uploadType === 'youtube'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Youtube className="h-6 w-6" />
                        <span className="font-medium">YouTube Video</span>
                      </button>
                      <button
                        onClick={() => setUploadType('pdf')}
                        className={`p-4 border-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                          uploadType === 'pdf'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <FileText className="h-6 w-6" />
                        <span className="font-medium">PDF Document</span>
                      </button>
                    </div>
                  </div>

                  {/* YouTube URL Input */}
                  {uploadType === 'youtube' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        YouTube URL
                      </label>
                      <div className="relative">
                        <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                        <input
                          type="url"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {/* PDF File Input */}
                  {uploadType === 'pdf' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PDF File
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {selectedFile && (
                        <p className="text-sm text-gray-600 mt-2">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Upload Button */}
                  {uploadType && (
                    <div className="flex justify-end">
                      <button
                        onClick={handleQuickUpload}
                        disabled={uploading}
                        className="btn-primary flex items-center"
                      >
                        {uploading ? (
                          <>
                            <LoadingSpinner size="sm" color="white" className="mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Resource
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
            </div>
            <div className="card-body">
              {recentActivities?.recentUsers?.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.recentUsers.map((user) => (
                    <div key={user._id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.institution}</p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent users</p>
              )}
            </div>
          </div>

          {/* Recent Resources */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Recent Resources</h2>
            </div>
            <div className="card-body">
              {recentActivities?.recentResources?.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.recentResources.map((resource) => (
                    <div key={resource._id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {resource.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          By {resource.uploadedBy?.name} • {resource.category}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(resource.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent resources</p>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Drills */}
        {recentActivities?.upcomingDrills?.length > 0 && (
          <div className="card mt-8">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Drills
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentActivities.upcomingDrills.map((drill) => (
                  <div key={drill._id} className="bg-indigo-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-1">{drill.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{drill.venue}</p>
                    <div className="text-xs text-gray-500">
                      {new Date(drill.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
