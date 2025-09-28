import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Filter,
  UserPlus,
  Info
} from 'lucide-react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const DrillsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    page: 1
  });

  const { data: drillsData, isLoading, error } = useQuery(
    ['drills', filters],
    () => userAPI.getDrills(filters),
    {
      keepPreviousData: true
    }
  );

  const registerMutation = useMutation(userAPI.registerForDrill, {
    onSuccess: () => {
      queryClient.invalidateQueries(['drills']);
      toast.success('Successfully registered for drill!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to register for drill');
    }
  });

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

  const handleRegister = (drillId) => {
    registerMutation.mutate(drillId);
  };

  if (isLoading && !drillsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading drills..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load drills
          </h3>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  const { drills = [], totalPages = 1, currentPage = 1, total = 0 } = drillsData || {};

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

  const isRegistered = (drill) => {
    return drill.registeredParticipants?.some(p => p.user === user?.id);
  };

  const canRegister = (drill) => {
    const drillDate = new Date(drill.scheduledDate);
    const now = new Date();
    const registrationDeadline = new Date(drillDate.getTime() - 24 * 60 * 60 * 1000);
    
    return drill.status === 'scheduled' && 
           now < registrationDeadline && 
           !isRegistered(drill) &&
           (drill.maxParticipants === 0 || drill.registeredParticipants?.length < drill.maxParticipants);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 flex items-center">
            <Calendar className="h-8 w-8 text-indigo-600 mr-3" />
            Disaster Drills
          </h1>
          <p className="text-gray-600 mt-1">
            Participate in disaster preparedness drills at UNITED UNIVERSITY
          </p>
        </div>

        {/* Stats */}
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
              <div className="text-2xl font-bold text-green-600 mb-1">
                {drills.filter(d => isRegistered(d)).length}
              </div>
              <div className="text-sm text-gray-600">Registered</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {drills.filter(d => d.status === 'completed' && isRegistered(d)).length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-select"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
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
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Drills List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading drills..." />
          </div>
        ) : drills.length > 0 ? (
          <>
            <div className="space-y-6">
              {drills.map((drill) => (
                <div key={drill._id} className="card">
                  <div className="card-body">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {drill.title}
                          </h3>
                          <span className={`badge ${getStatusColor(drill.status)}`}>
                            {drill.status}
                          </span>
                          <span className={`badge ${getTypeColor(drill.type)}`}>
                            {drill.type}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-4">
                          {drill.description}
                        </p>

                        {/* Drill Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{formatDate(drill.scheduledDate)}</div>
                              <div>{formatTime(drill.scheduledDate)}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{drill.venue}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{drill.duration} minutes</span>
                          </div>
                        </div>

                        {/* Participants */}
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>
                              {drill.registeredParticipants?.length || 0} registered
                              {drill.maxParticipants > 0 && ` / ${drill.maxParticipants} max`}
                            </span>
                          </div>
                          
                          {isRegistered(drill) && (
                            <div className="flex items-center space-x-1 text-sm text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>You're registered</span>
                            </div>
                          )}
                        </div>

                        {/* Objectives */}
                        {drill.objectives && drill.objectives.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Objectives:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                              {drill.objectives.slice(0, 3).map((objective, index) => (
                                <li key={index}>{objective}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Instructions */}
                        {drill.instructions && drill.instructions.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Instructions:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                              {drill.instructions.slice(0, 2).map((instruction, index) => (
                                <li key={index}>{instruction}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Organizer */}
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>Organized by {drill.organizer?.name}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0 ml-6">
                        {canRegister(drill) ? (
                          <button
                            onClick={() => handleRegister(drill._id)}
                            disabled={registerMutation.isLoading}
                            className="btn-primary flex items-center"
                          >
                            {registerMutation.isLoading ? (
                              <>
                                <LoadingSpinner size="sm" color="white" className="mr-2" />
                                Registering...
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Register
                              </>
                            )}
                          </button>
                        ) : isRegistered(drill) ? (
                          <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <span className="text-sm text-green-600 font-medium">Registered</span>
                          </div>
                        ) : drill.status === 'completed' ? (
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                              <CheckCircle className="h-6 w-6 text-gray-400" />
                            </div>
                            <span className="text-sm text-gray-500">Completed</span>
                          </div>
                        ) : drill.status === 'cancelled' ? (
                          <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                              <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <span className="text-sm text-red-600">Cancelled</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                              <Info className="h-6 w-6 text-gray-400" />
                            </div>
                            <span className="text-sm text-gray-500">Registration Closed</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Equipment Required */}
                    {drill.equipmentRequired && drill.equipmentRequired.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Equipment Required:</h4>
                        <div className="flex flex-wrap gap-2">
                          {drill.equipmentRequired.map((equipment, index) => (
                            <span key={index} className="badge badge-gray text-xs">
                              {equipment}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coordinators */}
                    {drill.coordinators && drill.coordinators.length > 0 && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Coordinators:</h4>
                        <div className="flex flex-wrap gap-4">
                          {drill.coordinators.map((coordinator, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              {coordinator.user?.name} ({coordinator.role})
                              {coordinator.contactNumber && (
                                <span className="ml-2 text-gray-500">
                                  {coordinator.contactNumber}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
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
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No drills found
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.status || filters.type
                ? 'No drills match your current filters.'
                : 'No disaster drills are currently scheduled for your institution.'}
            </p>
            {(filters.status || filters.type) && (
              <button
                onClick={() => setFilters({ status: '', type: '', page: 1 })}
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

export default DrillsPage;
