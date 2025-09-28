import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Heart,
  Play,
  FileText,
  ExternalLink,
  Star
} from 'lucide-react';
import { userAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ResourcesPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    difficulty: '',
    page: 1
  });

  const { data: resourcesData, isLoading, error } = useQuery(
    ['resources', filters],
    () => userAPI.getResources(filters),
    {
      keepPreviousData: true
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (isLoading && !resourcesData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading resources..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load resources
          </h3>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  const { resources = [], totalPages = 1, currentPage = 1, total = 0 } = resourcesData || {};

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video':
        return Play;
      case 'pdf':
        return FileText;
      case 'link':
        return ExternalLink;
      default:
        return BookOpen;
    }
  };

  // Get YouTube thumbnail
  const getYouTubeThumbnail = (youtubeId) => {
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
            Learning Resources
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive materials to help you learn disaster preparedness
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{total}</div>
              <div className="text-sm text-gray-600">Total Resources</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {resources.filter(r => r.type === 'video').length}
              </div>
              <div className="text-sm text-gray-600">Videos</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {resources.filter(r => r.type === 'pdf').length}
              </div>
              <div className="text-sm text-gray-600">Documents</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {resources.filter(r => r.type === 'link').length}
              </div>
              <div className="text-sm text-gray-600">External Links</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="form-input pl-10"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="form-select"
              >
                <option value="">All Types</option>
                <option value="video">Videos</option>
                <option value="pdf">PDFs</option>
                <option value="link">Links</option>
                <option value="image">Images</option>
              </select>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
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

              {/* Difficulty Filter */}
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="form-select"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              {/* Clear Filters */}
              <button
                onClick={() => setFilters({ search: '', type: '', category: '', difficulty: '', page: 1 })}
                className="btn-outline"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading resources..." />
          </div>
        ) : resources.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {resources.map((resource) => {
                const IconComponent = getResourceIcon(resource.type);
                return (
                  <div key={resource._id} className="card-hover">
                    <div className="card-body">
                      {/* YouTube Video Thumbnail */}
                      {resource.type === 'video' && resource.youtubeId && (
                        <div className="mb-4 relative">
                          <img 
                            src={getYouTubeThumbnail(resource.youtubeId)}
                            alt={resource.title}
                            className="w-full h-48 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-48 bg-red-100 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                            <Play className="h-16 w-16 text-red-500" />
                          </div>
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black bg-opacity-70 rounded-full p-4">
                              <Play className="h-8 w-8 text-white fill-current" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Resource Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${typeColors[resource.type] || 'bg-gray-100 text-gray-800'}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 line-clamp-2">
                              {resource.title}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
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
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{resource.views}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Download className="h-4 w-4" />
                            <span>{resource.downloads || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4" />
                            <span>{resource.likes?.length || 0}</span>
                          </div>
                        </div>
                        {resource.averageRating > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span>{resource.averageRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* Author */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xs text-gray-500">
                          By {resource.uploadedBy?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(resource.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Link
                          to={`/app/resources/${resource._id}`}
                          className="btn-primary w-full flex items-center justify-center"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Resource
                        </Link>
                        
                        {/* Direct YouTube link for videos */}
                        {resource.type === 'video' && resource.externalUrl && (
                          <a
                            href={resource.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline w-full flex items-center justify-center text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Watch on YouTube
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No resources found
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.type || filters.category || filters.difficulty
                ? 'Try adjusting your filters to see more results.'
                : 'Check back later for new resources!'}
            </p>
            {(filters.search || filters.type || filters.category || filters.difficulty) && (
              <button
                onClick={() => setFilters({ search: '', type: '', category: '', difficulty: '', page: 1 })}
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

export default ResourcesPage;
