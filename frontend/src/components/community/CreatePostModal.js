import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { X, Plus, Tag } from 'lucide-react';
import { communityAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CreatePostModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    type: 'discussion',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  const createPostMutation = useMutation(communityAPI.createPost, {
    onSuccess: () => {
      queryClient.invalidateQueries(['community-posts']);
      toast.success('Post created successfully!');
      onClose();
      setFormData({
        title: '',
        content: '',
        category: '',
        type: 'discussion',
        tags: []
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create post');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    createPostMutation.mutate(formData);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="form-label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="form-input"
              placeholder="Enter post title..."
              required
            />
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-select"
                required
              >
                <option value="">Select Category</option>
                <option value="earthquake">Earthquake</option>
                <option value="flood">Flood</option>
                <option value="fire">Fire</option>
                <option value="cyclone">Cyclone</option>
                <option value="first-aid">First Aid</option>
                <option value="evacuation">Evacuation</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="form-label">Post Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-select"
              >
                <option value="discussion">Discussion</option>
                <option value="question">Question</option>
                <option value="tip">Tip</option>
                <option value="experience">Experience</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="form-label">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="form-textarea"
              rows={6}
              placeholder="Share your thoughts, experiences, or ask questions..."
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="form-label">Tags</label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="form-input flex-1"
                placeholder="Add tags (press Enter to add)"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn-outline btn-sm"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-primary-600 hover:text-primary-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPostMutation.isLoading}
              className="btn-primary"
            >
              {createPostMutation.isLoading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
