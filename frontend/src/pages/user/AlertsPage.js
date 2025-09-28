import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  AlertTriangle, 
  Filter, 
  MapPin, 
  Clock, 
  ExternalLink,
  Bell,
  Info,
  AlertCircle,
  CheckCircle,
  Search,
  X
} from 'lucide-react';
import { alertsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AlertsPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    city: '',
    state: '',
    page: 1
  });
  const [viewMode, setViewMode] = useState('all'); // 'my-location', 'all', 'city', 'real-time'
  const [citySearch, setCitySearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [realTimeResults, setRealTimeResults] = useState(null);

  // Get available cities for city selection
  const { data: citiesData } = useQuery(
    'available-cities',
    alertsAPI.getAvailableCities,
    {
      enabled: viewMode === 'city'
    }
  );

  // Get alerts based on view mode
  const { data: alertsData, isLoading, error } = useQuery(
    ['alerts', viewMode, filters],
    () => {
      switch (viewMode) {
        case 'my-location':
          return alertsAPI.getMyLocationAlerts(filters);
        case 'city':
          return alertsAPI.getCityAlerts(filters.city, filters);
        case 'all':
        default:
          return alertsAPI.getAlerts(filters);
      }
    },
    {
      keepPreviousData: true,
      refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
    }
  );

  const { data: statsData } = useQuery(
    'alert-stats',
    alertsAPI.getAlertStats
  );

  const { data: recentAlertsData } = useQuery(
    'recent-alerts',
    alertsAPI.getRecentAlerts
  );

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleCitySearch = async (city) => {
    setCitySearch(city);
    if (city.trim()) {
      setIsSearching(true);
      setViewMode('real-time');
      setRealTimeResults(null);
      
      try {
        console.log(`🔍 Searching real-time alerts for: ${city}`);
        const result = await alertsAPI.searchCityRealTime(city.trim());
        setRealTimeResults(result);
        console.log(`✅ Found ${result.total} real-time alerts for ${city}`);
      } catch (error) {
        console.error('Real-time search error:', error);
        setRealTimeResults({
          city: city.trim(),
          alerts: [],
          total: 0,
          error: 'Failed to fetch real-time alerts. Please try again.'
        });
      } finally {
        setIsSearching(false);
      }
    } else {
      setViewMode('all');
      setRealTimeResults(null);
      setFilters(prev => ({
        ...prev,
        city: '',
        page: 1
      }));
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setFilters(prev => ({
      ...prev,
      city: mode === 'city' ? prev.city : '',
      state: mode === 'city' ? prev.state : '',
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
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

  if (isLoading && !alertsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading alerts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load alerts
          </h3>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  const { alerts = [], totalPages = 1, currentPage = 1, total = 0, location } = alertsData || {};
  const stats = statsData || {};
  const recentAlerts = recentAlertsData?.alerts || [];

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

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <Info className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900 flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                Disaster Alerts
              </h1>
              <p className="text-gray-600 mt-1">
                Stay informed about disasters and emergencies in your area
              </p>
              {location && viewMode === 'my-location' && (
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Showing alerts for {location.city}, {location.state}</span>
                </div>
              )}
              {viewMode === 'city' && filters.city && (
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Showing alerts for {filters.city}{filters.state && `, ${filters.state}`}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Auto-refresh enabled</span>
            </div>
          </div>
        </div>

        {/* City Search Bar */}
        <div className="mb-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Alerts by City
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter city name (e.g., Mumbai, Delhi, Chennai)..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCitySearch(citySearch);
                        }
                      }}
                      className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCitySearch(citySearch)}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                  >
                    <Search className="h-5 w-5" />
                    <span>Search</span>
                  </button>
                  {citySearch && (
                    <button
                      onClick={() => {
                        setCitySearch('');
                        handleCitySearch('');
                      }}
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
              {citySearch && (
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-medium">Tip:</span> Search for cities like Mumbai, Delhi, Chennai, Bangalore, Kolkata, etc.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Selection */}
        <div className="mb-6">
          <div className="card">
            <div className="card-body">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleViewModeChange('my-location')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'my-location'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MapPin className="h-4 w-4 mr-2 inline" />
                  My Location
                </button>
                <button
                  onClick={() => handleViewModeChange('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Search className="h-4 w-4 mr-2 inline" />
                  All Alerts
                </button>
                <button
                  onClick={() => handleViewModeChange('city')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'city'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MapPin className="h-4 w-4 mr-2 inline" />
                  By City
                </button>
              </div>
            </div>
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
              <div className="text-sm text-gray-600">Your Area</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {recentAlerts.length}
              </div>
              <div className="text-sm text-gray-600">Last 24h</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Alerts */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters */}
            <div className="card">
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                  {viewMode === 'city' && (
                    <>
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
                        <option value="">Select City</option>
                        {citiesData?.cities
                          ?.filter(city => !filters.state || city.state === filters.state)
                          .map(city => (
                            <option key={`${city.state}-${city.city}`} value={city.city}>
                              {city.city} ({city.alertCount} alerts)
                            </option>
                          ))}
                      </select>
                    </>
                  )}

                  <button
                    onClick={clearFilters}
                    className="btn-outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Real-time Search Results */}
            {viewMode === 'real-time' && (
              <div className="mb-6">
                <div className="card">
                  <div className="card-body">
                    {isSearching ? (
                      <div className="flex flex-col items-center py-8">
                        <LoadingSpinner size="lg" />
                        <p className="text-lg font-medium text-gray-900 mt-4">
                          🔍 Searching real-time alerts for "{citySearch}"
                        </p>
                        <p className="text-gray-600 mt-2">
                          Fetching live data from NDMA, IMD, SACHET, and ISRO...
                        </p>
                        <div className="flex items-center space-x-4 mt-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-500">NDMA</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-500">IMD</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-500">SACHET</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-500">ISRO</span>
                          </div>
                        </div>
                      </div>
                    ) : realTimeResults ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            🔴 Live Alerts for {realTimeResults.city}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span>Live • {realTimeResults.searchedAt ? new Date(realTimeResults.searchedAt).toLocaleTimeString() : 'Now'}</span>
                          </div>
                        </div>
                        
                        {realTimeResults.error ? (
                          <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600 font-medium">{realTimeResults.error}</p>
                          </div>
                        ) : realTimeResults.alerts && realTimeResults.alerts.length > 0 ? (
                          <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-green-800 text-sm">
                                ✅ Found {realTimeResults.total} real-time alerts from {realTimeResults.sources?.join(', ')}
                              </p>
                            </div>
                            {realTimeResults.alerts.map((alert) => (
                              <div key={alert._id} className={`card border-l-4 ${getSeverityColor(alert.severity)} bg-gradient-to-r from-blue-50 to-transparent`}>
                                <div className="card-body">
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start space-x-3 flex-1">
                                      <div className="flex-shrink-0 mt-1">
                                        {getSeverityIcon(alert.severity)}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <h3 className="text-lg font-semibold text-gray-900">
                                            {alert.title}
                                          </h3>
                                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                            LIVE
                                          </span>
                                        </div>
                                        <p className="text-gray-600 mb-3">
                                          {alert.description}
                                        </p>
                                        
                                        <div className="flex flex-wrap gap-2 mb-3">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(alert.type)}`}>
                                            {alert.type}
                                          </span>
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                                            {alert.severity}
                                          </span>
                                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                                            {alert.source}
                                          </span>
                                        </div>

                                        {alert.affectedAreas && alert.affectedAreas.length > 0 && (
                                          <div className="flex items-center text-sm text-gray-500 mb-2">
                                            <MapPin className="h-4 w-4 mr-1" />
                                            <span>
                                              {alert.affectedAreas.map(area => `${area.city}, ${area.state}`).join('; ')}
                                            </span>
                                          </div>
                                        )}

                                        <div className="flex items-center text-sm text-gray-500">
                                          <Clock className="h-4 w-4 mr-1" />
                                          <span>Issued {formatTimeAgo(alert.issuedAt)}</span>
                                          {alert.searchedAt && (
                                            <span className="ml-2 text-green-600">• Fetched live</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {alert.instructions && alert.instructions.length > 0 && (
                                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                      <h4 className="font-medium text-blue-900 mb-2">Safety Instructions:</h4>
                                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                                        {alert.instructions.map((instruction, index) => (
                                          <li key={index}>{instruction}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <p className="text-gray-600">No active alerts found for {realTimeResults.city}</p>
                            <p className="text-sm text-gray-500 mt-2">All clear! Stay safe and stay prepared.</p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Regular Alerts List */}
            {viewMode !== 'real-time' && (
              <>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" text="Loading alerts..." />
                  </div>
                ) : alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert._id} className={`card border-l-4 ${getSeverityColor(alert.severity)}`}>
                    <div className="card-body">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getSeverityIcon(alert.severity)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {alert.title}
                            </h3>
                            <p className="text-gray-600 mb-3">
                              {alert.description}
                            </p>
                            
                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className={`badge ${getTypeColor(alert.type)}`}>
                                {alert.type}
                              </span>
                              <span className={`badge ${getSeverityColor(alert.severity)}`}>
                                {alert.severity}
                              </span>
                              <span className="badge badge-gray">
                                {alert.source}
                              </span>
                            </div>

                            {/* Instructions */}
                            {alert.instructions && alert.instructions.length > 0 && (
                              <div className="mb-3">
                                <h4 className="font-medium text-gray-900 mb-2">Safety Instructions:</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                  {alert.instructions.slice(0, 3).map((instruction, index) => (
                                    <li key={index}>{instruction}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Emergency Contacts */}
                            {alert.emergencyContacts && alert.emergencyContacts.length > 0 && (
                              <div className="mb-3">
                                <h4 className="font-medium text-gray-900 mb-2">Emergency Contacts:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {alert.emergencyContacts.slice(0, 2).map((contact, index) => (
                                    <div key={index} className="text-sm bg-gray-100 px-2 py-1 rounded">
                                      {contact.name}: {contact.phone}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Affected Areas */}
                            {alert.affectedAreas && alert.affectedAreas.length > 0 && (
                              <div className="flex items-center text-sm text-gray-500 mb-2">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>
                                  {alert.affectedAreas.map(area => 
                                    `${area.city}, ${area.state}`
                                  ).join('; ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 text-right">
                          <div className="text-sm text-gray-500 mb-2">
                            <Clock className="h-4 w-4 inline mr-1" />
                            {formatTimeAgo(alert.issuedAt)}
                          </div>
                          {alert.sourceUrl && (
                            <a
                              href={alert.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Source
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          {alert.views} views • Priority: {alert.priority}/10
                        </div>
                        {alert.expiresAt && (
                          <div className="text-xs text-gray-500">
                            Expires: {new Date(alert.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No active alerts
                </h3>
                <p className="text-gray-600 mb-4">
                  {(filters.type || filters.severity || filters.city || filters.state)
                    ? 'No alerts match your current filters.'
                    : 'Great news! There are no active disaster alerts in your area.'}
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
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Alerts */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Clock className="h-4 w-4 text-blue-500 mr-2" />
                  Recent Alerts (24h)
                </h3>
              </div>
              <div className="card-body">
                {recentAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {recentAlerts.slice(0, 5).map((alert) => (
                      <div key={alert._id} className="border-l-2 border-gray-200 pl-3">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {alert.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`badge text-xs ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(alert.issuedAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent alerts</p>
                  </div>
                )}
              </div>
            </div>

            {/* Alert Types */}
            {stats.byType && stats.byType.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold text-gray-900">Alert Types</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-2">
                    {stats.byType.map((type) => (
                      <div key={type._id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{type._id}</span>
                        <span className="text-sm font-medium text-gray-900">{type.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Numbers */}
            <div className="card border-red-200 bg-red-50">
              <div className="card-header bg-red-100 border-red-200">
                <h3 className="font-semibold text-red-900 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Emergency Contacts
                </h3>
              </div>
              <div className="card-body">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-800">Fire Emergency:</span>
                    <span className="font-bold text-red-900">101</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-800">Police:</span>
                    <span className="font-bold text-red-900">112</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-800">Medical Emergency:</span>
                    <span className="font-bold text-red-900">108</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-800">Disaster Helpline:</span>
                    <span className="font-bold text-red-900">1078</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-800">Women Helpline:</span>
                    <span className="font-bold text-red-900">1091</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-800">Child Helpline:</span>
                    <span className="font-bold text-red-900">1098</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
