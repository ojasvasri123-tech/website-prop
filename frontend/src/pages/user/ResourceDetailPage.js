import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  ArrowLeft, 
  Download, 
  Heart, 
  Eye, 
  Star, 
  MessageCircle,
  Play,
  ExternalLink,
  FileText,
  Send
} from 'lucide-react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ResourceDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);

  const { data: resourceData, isLoading, error } = useQuery(
    ['resource', id],
    () => userAPI.getResource(id)
  );

  const likeMutation = useMutation(userAPI.likeResource, {
    onSuccess: () => {
      queryClient.invalidateQueries(['resource', id]);
      toast.success('Like updated!');
    },
    onError: () => {
      toast.error('Failed to update like');
    }
  });

  const commentMutation = useMutation(userAPI.commentResource, {
    onSuccess: () => {
      queryClient.invalidateQueries(['resource', id]);
      setComment('');
      setRating(0);
      toast.success('Comment added successfully!');
    },
    onError: () => {
      toast.error('Failed to add comment');
    }
  });

  const downloadMutation = useMutation(userAPI.downloadResource, {
    onSuccess: (response) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resource.fileName || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      queryClient.invalidateQueries(['resource', id]);
      toast.success('Download started!');
    },
    onError: () => {
      toast.error('Failed to download resource');
    }
  });

  const handleLike = () => {
    likeMutation.mutate(id);
  };

  const handleComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    commentMutation.mutate([id, { text: comment, rating: rating || undefined }]);
  };

  const handleDownload = () => {
    downloadMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading resource..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Resource not found
          </h3>
          <p className="text-gray-600 mb-4">
            The resource you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/app/resources" className="btn-primary">
            Browse Resources
          </Link>
        </div>
      </div>
    );
  }

  const resource = resourceData?.resource;

  if (!resource) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  const isLiked = resource?.likes?.some(
    (like) => like.user._id === user?.id
  );
  const userHasCommented = resource?.comments?.some(
    (comment) => comment.user._id === user?.id
  );

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video':
        return Play;
      case 'pdf':
        return FileText;
      case 'link':
        return ExternalLink;
      default:
        return FileText;
    }
  };

  const typeColors = {
    video: 'bg-red-100 text-red-800',
    pdf: 'bg-blue-100 text-blue-800',
    link: 'bg-green-100 text-green-800',
    image: 'bg-purple-100 text-purple-800'
  };

  const categoryColors = {
    earthquake: 'bg-orange-100 text-orange-800',
    flood: 'bg-blue-100 text-blue-800',
    fire: 'bg-red-100 text-red-800',
    cyclone: 'bg-purple-100 text-purple-800',
    general: 'bg-gray-100 text-gray-800',
    'first-aid': 'bg-pink-100 text-pink-800',
    evacuation: 'bg-indigo-100 text-indigo-800'
  };

  const IconComponent = getResourceIcon(resource.type);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/app/resources"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resource Header */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-start space-x-4 mb-6">
                  <div className={`p-3 rounded-lg ${typeColors[resource.type] || 'bg-gray-100 text-gray-800'}`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
                      {resource.title}
                    </h1>
                    <p className="text-gray-600 mb-4">
                      {resource.description}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className={`badge ${categoryColors[resource.category] || 'bg-gray-100 text-gray-800'}`}>
                        {resource.category}
                      </span>
                      <span className="badge badge-gray capitalize">
                        {resource.difficulty}
                      </span>
                      <span className="badge badge-gray capitalize">
                        {resource.targetAudience}
                      </span>
                      <span className="badge badge-gray capitalize">
                        {resource.type}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{resource.views} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Download className="h-4 w-4" />
                        <span>{resource.downloads || 0} downloads</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4" />
                        <span>{resource.likes?.length || 0} likes</span>
                      </div>
                      {resource.averageRating > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{resource.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  {resource.type === 'link' ? (
                    <a
                      href={resource.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Link
                    </a>
                  ) : resource.filePath && (
                    <button
                      onClick={handleDownload}
                      disabled={downloadMutation.isLoading}
                      className="btn-primary flex items-center"
                    >
                      {downloadMutation.isLoading ? (
                        <>
                          <LoadingSpinner size="sm" color="white" className="mr-2" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={handleLike}
                    disabled={likeMutation.isLoading}
                    className={`btn flex items-center ${
                      isLiked ? 'btn-danger' : 'btn-outline'
                    }`}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                    {isLiked ? 'Liked' : 'Like'}
                  </button>
                </div>
              </div>
            </div>

            {/* Video Player */}
            {resource.type === 'video' && resource.youtubeId && (
              <div className="card">
                <div className="card-body">
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${resource.youtubeId}`}
                      title={resource.title}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Comments ({resource.comments?.length || 0})
                </h3>
              </div>
              <div className="card-body">
                {/* Add Comment Form */}
                {user && !userHasCommented && (
                  <form onSubmit={handleComment} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="mb-4">
                      <label className="form-label">Add a comment</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your thoughts about this resource..."
                        className="form-textarea"
                        rows={3}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="form-label">Rating (optional)</label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`p-1 ${
                              star <= rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            <Star className="h-5 w-5 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!comment.trim() || commentMutation.isLoading}
                      className="btn-primary flex items-center disabled:opacity-50"
                    >
                      {commentMutation.isLoading ? (
                        <>
                          <LoadingSpinner size="sm" color="white" className="mr-2" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Add Comment
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {resource.comments?.length > 0 ? (
                    resource.comments.map((comment, index) => (
                      <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary-600">
                              {comment.user?.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {comment.user?.name}
                              </span>
                              {comment.rating && (
                                <div className="flex items-center space-x-1">
                                  {[...Array(comment.rating)].map((_, i) => (
                                    <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                                  ))}
                                </div>
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm">{comment.text}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resource Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Resource Details</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900 capitalize">{resource.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-gray-900 capitalize">{resource.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-medium text-gray-900 capitalize">{resource.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target:</span>
                    <span className="font-medium text-gray-900 capitalize">{resource.targetAudience}</span>
                  </div>
                  {resource.fileSize && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">File Size:</span>
                      <span className="font-medium text-gray-900">
                        {(resource.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  )}
                  {resource.duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium text-gray-900">
                        {Math.floor(resource.duration / 60)}:{(resource.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Author Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Uploaded By</h3>
              </div>
              <div className="card-body">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {resource.uploadedBy?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{resource.uploadedBy?.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-gray-900">Tags</h3>
                </div>
                <div className="card-body">
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag, index) => (
                      <span key={index} className="badge badge-gray">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailPage;
