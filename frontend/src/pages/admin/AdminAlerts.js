import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Bell
} from 'lucide-react';
import { alertsAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminAlerts = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    city: '',
    state: '',
    page: 1
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);

  // Get all alerts
  const { data: alertsData, isLoading } = useQuery(
    ['admin-alerts', filters],
    () => alertsAPI.getAlerts(filters),
    {
      keepPreviousData: true
    }
  );

  // Get available cities
  const { data: citiesData } = useQuery(
    'available-cities',
    alertsAPI.getAvailableCities
  );

  // Get alert stats
  const { data: statsData } = useQuery(
    'alert-stats',
    alertsAPI.getAlertStats
  );

  // Update alert mutation
  const updateAlertMutation = useMutation(
    ({ id, data }) => alertsAPI.updateAlert(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-alerts']);
        toast.success('Alert updated successfully');
        setEditingAlert(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update alert');
      }
    }
  );

  // Delete alert mutation
  const deleteAlertMutation = useMutation(
    (id) => alertsAPI.deleteAlert(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-alerts']);
        toast.success('Alert deactivated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete alert');
      }
    }
  );

  // Verify alert mutation
  const verifyAlertMutation = useMutation(
    (id) => alertsAPI.verifyAlert(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-alerts']);
        toast.success('Alert verified successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to verify alert');
      }
    }
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      severity: '',
      city: '',
      state: '',
      page: 1
    });
  };

  const handleUpdateAlert = (alertId, updates) => {
    updateAlertMutation.mutate({ id: alertId, data: updates });
  };

  const handleDeleteAlert = (alertId) => {
    if (window.confirm('Are you sure you want to deactivate this alert?')) {
      deleteAlertMutation.mutate(alertId);
    }
  };

  const handleVerifyAlert = (alertId) => {
    verifyAlertMutation.mutate(alertId);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'earthquake':
        return 'bg-orange-100 text-orange-800';
      case 'flood':
        return 'bg-blue-100 text-blue-800';
      case 'fire':
        return 'bg-red-100 text-red-800';
      case 'cyclone':
        return 'bg-purple-100 text-purple-800';
      case 'weather':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const alertDate = new Date(date);
    const diffInHours = Math.floor((now - alertDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - alertDate) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const { alerts = [], totalPages = 1, currentPage = 1, total = 0 } = alertsData || {};
  const stats = statsData || {};

  if (isLoading && !alertsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading alerts..." />
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
                <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                Alert Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage disaster alerts and emergency notifications
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Alert
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {stats.overview?.criticalAlerts || 0}
              </div>
              <div className="text-sm text-gray-600">Critical Alerts</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {stats.overview?.highAlerts || 0}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {total}
              </div>
              <div className="text-sm text-gray-600">Total Alerts</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {citiesData?.cities?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Affected Cities</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="form-select"
              >
                <option value="">All Types</option>
                <option value="earthquake">Earthquake</option>
                <option value="flood">Flood</option>
                <option value="fire">Fire</option>
                <option value="cyclone">Cyclone</option>
                <option value="weather">Weather</option>
                <option value="general">General</option>
              </select>

              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="form-select"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="form-select"
              >
                <option value="">All States</option>
                {citiesData?.cities
                  ?.filter((city, index, self) => 
                    city.state && self.findIndex(c => c.state === city.state) === index
                  )
                  .map(city => (
                    <option key={city.state} value={city.state}>
                      {city.state}
                    </option>
                  ))}
              </select>

              <select
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="form-select"
                disabled={!filters.state}
              >
                <option value="">All Cities</option>
                {citiesData?.cities
                  ?.filter(city => !filters.state || city.state === filters.state)
                  .map(city => (
                    <option key={`${city.state}-${city.city}`} value={city.city}>
                      {city.city} ({city.alertCount})
                    </option>
                  ))}
              </select>

              <button
                onClick={clearFilters}
                className="btn-outline"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert._id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {alert.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(alert.type)}`}>
                        {alert.type}
                      </span>
                      {alert.isVerified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{alert.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>
                          {alert.affectedAreas?.map(area => `${area.city}, ${area.state}`).join(', ') || 'Multiple locations'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{formatTimeAgo(alert.issuedAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <Bell className="h-4 w-4 mr-1" />
                        <span>{alert.notificationsSent || 0} sent</span>
                      </div>
                      {alert.sourceUrl && (
                        <a
                          href={alert.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Source
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {!alert.isVerified && (
                      <button
                        onClick={() => handleVerifyAlert(alert._id)}
                        className="btn-outline text-green-600 border-green-600 hover:bg-green-50"
                        disabled={verifyAlertMutation.isLoading}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => setEditingAlert(alert)}
                      className="btn-outline text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert._id)}
                      className="btn-outline text-red-600 border-red-600 hover:bg-red-50"
                      disabled={deleteAlertMutation.isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {alerts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No alerts found
            </h3>
            <p className="text-gray-600 mb-4">
              {(filters.type || filters.severity || filters.city || filters.state)
                ? 'No alerts match your current filters.'
                : 'No alerts have been created yet.'}
            </p>
            {(filters.type || filters.severity || filters.city || filters.state) && (
              <button
                onClick={clearFilters}
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

export default AdminAlerts;
