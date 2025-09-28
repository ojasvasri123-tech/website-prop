import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  MessageCircle, 
  Heart, 
  Filter, 
  Search,
  Users,
  TrendingUp,
  Clock,
  Tag,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { communityAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CreatePostModal from '../../components/community/CreatePostModal';
import toast from 'react-hot-toast';

const CommunityPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    search: '',
    sortBy: 'recent'
  });

  const { data: postsData, isLoading } = useQuery(
    ['community-posts', filters],
    () => communityAPI.getPosts(filters),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  const likeMutation = useMutation(communityAPI.likePost, {
    onSuccess: () => {
      queryClient.invalidateQueries(['community-posts']);
      toast.success('Post liked!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to like post');
    }
  });

  const deleteMutation = useMutation(communityAPI.deletePost, {
    onSuccess: () => {
      queryClient.invalidateQueries(['community-posts']);
      toast.success('Post deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    }
  });

  const handleLike = (postId) => {
    likeMutation.mutate(postId);
  };

  const handleDelete = (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate(postId);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      earthquake: 'bg-orange-100 text-orange-800',
      flood: 'bg-blue-100 text-blue-800',
      fire: 'bg-red-100 text-red-800',
      cyclone: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800',
      'first-aid': 'bg-pink-100 text-pink-800',
      evacuation: 'bg-green-100 text-green-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type) => {
    const icons = {
      discussion: MessageCircle,
      question: '?',
      tip: '💡',
      experience: '📝',
      announcement: '📢'
    };
    return icons[type] || MessageCircle;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading community posts..." />
      </div>
    );
  }

  const posts = postsData?.posts || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
                Community
              </h1>
              <p className="text-gray-600">
                Connect with other students and share your disaster preparedness experiences.
              </p>
            </div>
            <button
              onClick={() => setShowCreatePost(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="card mb-6">
              <div className="card-body">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="">All Categories</option>
                    <option value="earthquake">Earthquake</option>
                    <option value="flood">Flood</option>
                    <option value="fire">Fire</option>
                    <option value="cyclone">Cyclone</option>
                    <option value="first-aid">First Aid</option>
                    <option value="evacuation">Evacuation</option>
                    <option value="general">General</option>
                  </select>
                  
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="form-select"
                  >
                    <option value="">All Types</option>
                    <option value="discussion">Discussion</option>
                    <option value="question">Question</option>
                    <option value="tip">Tip</option>
                    <option value="experience">Experience</option>
                    <option value="announcement">Announcement</option>
                  </select>
                  
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="form-select"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-6">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post._id} className="card">
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {post.author.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{post.author.name}</h3>
                            <p className="text-sm text-gray-500">{post.author.institution}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`badge ${getCategoryColor(post.category)}`}>
                            {post.category}
                          </span>
                          {post.author._id === user?.id && (
                            <div className="relative">
                              <button className="text-gray-400 hover:text-gray-600">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              {/* Dropdown menu would go here */}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        {post.title}
                      </h2>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.content}
                      </p>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleLike(post._id)}
                            className={`flex items-center space-x-1 text-sm ${
                              post.isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                            <span>{post.likes.length}</span>
                          </button>
                          
                          <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comments.length}</span>
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeAgo(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card">
                  <div className="card-body text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No posts found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Be the first to start a discussion in the community!
                    </p>
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="btn-primary"
                    >
                      Create First Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Community Stats */}
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-gray-900">Community Stats</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Posts</span>
                      <span className="font-medium text-gray-900">
                        {postsData?.total || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Active Members</span>
                      <span className="font-medium text-gray-900">-</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="w-full btn-outline text-left"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </button>
                    <button className="w-full btn-outline text-left">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Trending Topics
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
      />
    </div>
  );
};

export default CommunityPage;