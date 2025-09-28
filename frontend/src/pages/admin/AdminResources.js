import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  BookOpen, 
  Plus, 
  Upload, 
  Youtube, 
  FileText, 
  Link, 
  Image,
  Edit,
  Trash2,
  Eye,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
  const resourceType = watch('type');

  // Fetch resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getResources({
        search: searchTerm,
        category: filterCategory,
        type: filterType
      });
      setResources(response.data.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [searchTerm, filterCategory, filterType]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      
      // Add basic fields
      Object.keys(data).forEach(key => {
        if (key !== 'file' && data[key]) {
          formData.append(key, data[key]);
        }
      });

      // Handle file upload for PDFs
      if (data.type === 'pdf' && data.file && data.file[0]) {
        formData.append('file', data.file[0]);
      }

      // Handle YouTube video URL
      if (data.type === 'video' && data.externalUrl) {
        formData.append('youtubeUrl', data.externalUrl);
        const youtubeId = extractYouTubeId(data.externalUrl);
        if (youtubeId) {
          formData.append('youtubeId', youtubeId);
        }
      }

      if (editingResource) {
        await adminAPI.updateResource(editingResource._id, formData);
        toast.success('Resource updated successfully');
      } else {
        await adminAPI.uploadResource(formData);
        toast.success('Resource uploaded successfully');
      }

      reset();
      setShowUploadForm(false);
      setEditingResource(null);
      fetchResources();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error(error.response?.data?.message || 'Failed to save resource');
    }
  };

  // Delete resource
  const handleDeleteResource = async (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      try {
        await adminAPI.deleteResource(resourceId);
        toast.success('Resource deleted successfully');
        fetchResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
        toast.error('Failed to delete resource');
      }
    }
  };

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Get YouTube thumbnail
  const getYouTubeThumbnail = (youtubeId) => {
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  };

  // Handle edit
  const handleEdit = (resource) => {
    setEditingResource(resource);
    setShowUploadForm(true);
    
    // Populate form with existing data
    Object.keys(resource).forEach(key => {
      setValue(key, resource[key]);
    });
  };

  // Handle delete
  const handleDelete = async (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await adminAPI.deleteResource(resourceId);
        toast.success('Resource deleted successfully');
        fetchResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
        toast.error('Failed to delete resource');
      }
    }
  };

  // Get resource type icon
  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return <Youtube className="h-5 w-5 text-red-500" />;
      case 'pdf': return <FileText className="h-5 w-5 text-red-600" />;
      case 'link': return <Link className="h-5 w-5 text-blue-500" />;
      case 'image': return <Image className="h-5 w-5 text-green-500" />;
      default: return <BookOpen className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading resources..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Resource Management</h1>
            <p className="text-gray-600 mt-2">Upload and manage learning resources</p>
          </div>
          <button
            onClick={() => {
              setShowUploadForm(true);
              setEditingResource(null);
              reset();
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Resource</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="earthquake">Earthquake</option>
                <option value="flood">Flood</option>
                <option value="fire">Fire</option>
                <option value="cyclone">Cyclone</option>
                <option value="general">General</option>
                <option value="first-aid">First Aid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="link">Link</option>
                <option value="image">Image</option>
              </select>
            </div>
          </div>
        </div>

        {/* Upload Form Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {editingResource ? 'Edit Resource' : 'Add New Resource'}
                </h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input
                        type="text"
                        {...register('title', { required: 'Title is required' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select
                        {...register('type', { required: 'Type is required' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select Type</option>
                        <option value="video">YouTube Video</option>
                        <option value="pdf">PDF Document</option>
                        <option value="link">External Link</option>
                        <option value="image">Image</option>
                      </select>
                      {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      {...register('description', { required: 'Description is required' })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select
                        {...register('category', { required: 'Category is required' })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select Category</option>
                        <option value="earthquake">Earthquake</option>
                        <option value="flood">Flood</option>
                        <option value="fire">Fire</option>
                        <option value="cyclone">Cyclone</option>
                        <option value="general">General</option>
                        <option value="first-aid">First Aid</option>
                      </select>
                      {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                      <select
                        {...register('difficulty')}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  {/* Conditional Fields Based on Type */}
                  {resourceType === 'video' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL *</label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        {...register('externalUrl', { 
                          required: resourceType === 'video' ? 'YouTube URL is required' : false,
                          pattern: {
                            value: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
                            message: 'Please enter a valid YouTube URL'
                          }
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.externalUrl && <p className="text-red-500 text-sm mt-1">{errors.externalUrl.message}</p>}
                    </div>
                  )}

                  {resourceType === 'pdf' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PDF File *</label>
                      <input
                        type="file"
                        accept=".pdf"
                        {...register('file', { 
                          required: resourceType === 'pdf' && !editingResource ? 'PDF file is required' : false 
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file.message}</p>}
                    </div>
                  )}

                  {resourceType === 'link' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">External URL *</label>
                      <input
                        type="url"
                        placeholder="https://example.com"
                        {...register('externalUrl', { 
                          required: resourceType === 'link' ? 'URL is required' : false 
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.externalUrl && <p className="text-red-500 text-sm mt-1">{errors.externalUrl.message}</p>}
                    </div>
                  )}

                  {resourceType === 'image' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Image File *</label>
                      <input
                        type="file"
                        accept="image/*"
                        {...register('file', { 
                          required: resourceType === 'image' && !editingResource ? 'Image file is required' : false 
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file.message}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input
                      type="text"
                      placeholder="Enter tags separated by commas"
                      {...register('tags')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadForm(false);
                        setEditingResource(null);
                        reset();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{editingResource ? 'Update' : 'Upload'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Resources List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Resources ({resources.length})
            </h2>
          </div>
          
          {resources.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600 mb-4">Get started by uploading your first resource.</p>
              <button
                onClick={() => setShowUploadForm(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Upload Resource
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {resources.map((resource) => (
                <div key={resource._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Thumbnail for YouTube videos */}
                      {resource.type === 'video' && resource.youtubeId ? (
                        <div className="flex-shrink-0">
                          <img 
                            src={getYouTubeThumbnail(resource.youtubeId)}
                            alt={resource.title}
                            className="w-24 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-24 h-16 bg-red-100 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                            <Youtube className="h-8 w-8 text-red-500" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-shrink-0">
                          {getResourceIcon(resource.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {resource.title}
                        </h3>
                        <p className="text-gray-600 mt-1 line-clamp-2">
                          {resource.description}
                        </p>
                        {/* Show YouTube URL for video resources */}
                        {resource.type === 'video' && resource.externalUrl && (
                          <div className="mt-2">
                            <a 
                              href={resource.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            >
                              <Youtube className="h-4 w-4" />
                              <span>View on YouTube</span>
                            </a>
                          </div>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="capitalize">{resource.category}</span>
                          <span className="capitalize">{resource.difficulty}</span>
                          <span className="capitalize">{resource.type}</span>
                          <span>{resource.views} views</span>
                          <span>{resource.downloads} downloads</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(resource)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteResource(resource._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminResources;
