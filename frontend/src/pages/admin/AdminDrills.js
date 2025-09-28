import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Filter,
  Search
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminDrills = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDrill, setEditingDrill] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    page: 1
  });

  // Fetch drills
  const { data: drillsData, isLoading } = useQuery(
    ['admin-drills', filters],
    () => adminAPI.getDrills(filters),
    {
      keepPreviousData: true
    }
  );

  // Create drill mutation
  const createDrillMutation = useMutation(adminAPI.createDrill, {
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-drills']);
      toast.success('Drill scheduled successfully');
      setShowCreateForm(false);
      setEditingDrill(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to schedule drill');
    }
  });

  // Update drill mutation
  const updateDrillMutation = useMutation(
    ({ id, data }) => adminAPI.updateDrill(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-drills']);
        toast.success('Drill updated successfully');
        setShowCreateForm(false);
        setEditingDrill(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update drill');
      }
    }
  );

  // Delete drill mutation
  const deleteDrillMutation = useMutation(adminAPI.deleteDrill, {
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-drills']);
      toast.success('Drill deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete drill');
    }
  });

  const handleCreateDrill = (formData) => {
    const drillData = {
      ...formData,
      institution: 'UNITED UNIVERSITY',
      scheduledDate: new Date(formData.scheduledDate),
      objectives: formData.objectives.split('\n').filter(obj => obj.trim()),
      instructions: formData.instructions.split('\n').filter(inst => inst.trim()),
      safetyGuidelines: formData.safetyGuidelines.split('\n').filter(guide => guide.trim()),
      equipmentRequired: formData.equipmentRequired.split('\n').filter(eq => eq.trim())
    };

    if (editingDrill) {
      updateDrillMutation.mutate({ id: editingDrill._id, data: drillData });
    } else {
      createDrillMutation.mutate(drillData);
    }
  };

  const handleDeleteDrill = (drillId) => {
    if (window.confirm('Are you sure you want to delete this drill? This action cannot be undone.')) {
      deleteDrillMutation.mutate(drillId);
    }
  };

  const handleEditDrill = (drill) => {
    setEditingDrill(drill);
    setShowCreateForm(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'fire':
        return 'bg-red-100 text-red-800';
      case 'earthquake':
        return 'bg-orange-100 text-orange-800';
      case 'flood':
        return 'bg-blue-100 text-blue-800';
      case 'evacuation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const { drills = [], totalPages = 1, currentPage = 1, total = 0 } = drillsData || {};

  if (isLoading && !drillsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading drills..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900 flex items-center">
                <Calendar className="h-8 w-8 text-indigo-600 mr-3" />
                Drill Management
              </h1>
              <p className="text-gray-600 mt-1">
                Schedule and manage disaster preparedness drills for UNITED UNIVERSITY
              </p>
            </div>
            <button
              onClick={() => {
                setEditingDrill(null);
                setShowCreateForm(true);
              }}
              className="btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Schedule Drill
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-indigo-600 mb-1">{total}</div>
              <div className="text-sm text-gray-600">Total Drills</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {drills.filter(d => d.status === 'scheduled').length}
              </div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {drills.filter(d => d.status === 'in-progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {drills.filter(d => d.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                className="form-select"
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                className="form-select"
              >
                <option value="">All Types</option>
                <option value="fire">Fire Drill</option>
                <option value="earthquake">Earthquake Drill</option>
                <option value="flood">Flood Drill</option>
                <option value="evacuation">Evacuation Drill</option>
                <option value="general">General Drill</option>
              </select>

              <button
                onClick={() => setFilters({ status: '', type: '', page: 1 })}
                className="btn-outline"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Drills List */}
        <div className="space-y-6">
          {drills.length > 0 ? (
            drills.map((drill) => (
              <div key={drill._id} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{drill.title}</h3>
                        <span className={`badge ${getStatusColor(drill.status)}`}>
                          {drill.status}
                        </span>
                        <span className={`badge ${getTypeColor(drill.type)}`}>
                          {drill.type}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{drill.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(drill.scheduledDate).toLocaleDateString()} at{' '}
                          {new Date(drill.scheduledDate).toLocaleTimeString()}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {drill.venue}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {drill.duration} minutes
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          {drill.registeredParticipants?.length || 0} registered
                          {drill.maxParticipants > 0 && ` / ${drill.maxParticipants} max`}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Target: {drill.targetAudience}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditDrill(drill)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Drill"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDrill(drill._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete Drill"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No drills scheduled</h3>
              <p className="text-gray-600 mb-4">
                Get started by scheduling your first disaster preparedness drill.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
              >
                Schedule First Drill
              </button>
            </div>
          )}
        </div>

        {/* Create/Edit Drill Modal */}
        {showCreateForm && (
          <DrillForm
            drill={editingDrill}
            onSubmit={handleCreateDrill}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingDrill(null);
            }}
            isLoading={createDrillMutation.isLoading || updateDrillMutation.isLoading}
          />
        )}
      </div>
    </div>
  );
};

// Drill Form Component
const DrillForm = ({ drill, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    title: drill?.title || '',
    description: drill?.description || '',
    type: drill?.type || 'fire',
    scheduledDate: drill?.scheduledDate ? new Date(drill.scheduledDate).toISOString().slice(0, 16) : '',
    duration: drill?.duration || 60,
    venue: drill?.venue || '',
    targetAudience: drill?.targetAudience || 'all',
    maxParticipants: drill?.maxParticipants || 0,
    objectives: drill?.objectives?.join('\n') || '',
    instructions: drill?.instructions?.join('\n') || '',
    safetyGuidelines: drill?.safetyGuidelines?.join('\n') || '',
    equipmentRequired: drill?.equipmentRequired?.join('\n') || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {drill ? 'Edit Drill' : 'Schedule New Drill'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="fire">Fire Drill</option>
                  <option value="earthquake">Earthquake Drill</option>
                  <option value="flood">Flood Drill</option>
                  <option value="evacuation">Evacuation Drill</option>
                  <option value="general">General Drill</option>
                </select>
              </div>

              <div>
                <label className="form-label">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => handleChange('scheduledDate', e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Duration (minutes) *</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                  className="form-input"
                  min="15"
                  max="480"
                  required
                />
              </div>

              <div>
                <label className="form-label">Venue *</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => handleChange('venue', e.target.value)}
                  className="form-input"
                  placeholder="e.g., Main Building, Auditorium"
                  required
                />
              </div>

              <div>
                <label className="form-label">Target Audience *</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => handleChange('targetAudience', e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="all">All Students & Staff</option>
                  <option value="students">Students Only</option>
                  <option value="staff">Staff Only</option>
                  <option value="specific-groups">Specific Groups</option>
                </select>
              </div>

              <div>
                <label className="form-label">Max Participants (0 = unlimited)</label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value) || 0)}
                  className="form-input"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="form-textarea"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Objectives (one per line)</label>
                <textarea
                  value={formData.objectives}
                  onChange={(e) => handleChange('objectives', e.target.value)}
                  className="form-textarea"
                  rows={4}
                  placeholder="Practice evacuation procedures&#10;Test emergency communication&#10;Assess response time"
                />
              </div>

              <div>
                <label className="form-label">Instructions (one per line)</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => handleChange('instructions', e.target.value)}
                  className="form-textarea"
                  rows={4}
                  placeholder="Remain calm and follow instructions&#10;Use designated evacuation routes&#10;Gather at assembly points"
                />
              </div>

              <div>
                <label className="form-label">Safety Guidelines (one per line)</label>
                <textarea
                  value={formData.safetyGuidelines}
                  onChange={(e) => handleChange('safetyGuidelines', e.target.value)}
                  className="form-textarea"
                  rows={4}
                  placeholder="Do not use elevators&#10;Stay low if smoke is present&#10;Help those who need assistance"
                />
              </div>

              <div>
                <label className="form-label">Equipment Required (one per line)</label>
                <textarea
                  value={formData.equipmentRequired}
                  onChange={(e) => handleChange('equipmentRequired', e.target.value)}
                  className="form-textarea"
                  rows={4}
                  placeholder="Megaphones&#10;First aid kits&#10;Emergency lighting"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="btn-outline"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    {drill ? 'Updating...' : 'Scheduling...'}
                  </>
                ) : (
                  drill ? 'Update Drill' : 'Schedule Drill'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDrills;
