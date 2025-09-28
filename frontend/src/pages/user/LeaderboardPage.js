import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Users, 
  Filter,
  Crown,
  Star
} from 'lucide-react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    institution: '',
    page: 1
  });

  const { data: leaderboardData, isLoading, error } = useQuery(
    ['leaderboard', filters],
    () => userAPI.getLeaderboard(filters),
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

  if (isLoading && !leaderboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading leaderboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load leaderboard
          </h3>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  const { leaderboard = [], totalPages = 1, currentPage = 1, total = 0 } = leaderboardData || {};
  
  const currentUserRank = leaderboard.find(entry => entry._id === user?.id)?.rank;

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-orange-500" />;
      default:
        return <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">{rank}</div>;
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-heading font-bold text-gray-900 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
              Leaderboard
            </h1>
            <p className="text-gray-600 mt-2">
              See how you rank among disaster preparedness champions
            </p>
          </div>
        </div>

        {/* User's Current Rank */}
        {currentUserRank && (
          <div className="card mb-8 border-primary-200 bg-primary-50">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Your Current Rank</h3>
                    <p className="text-sm text-gray-600">{user?.institution}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    {getRankIcon(currentUserRank)}
                    <span className="text-2xl font-bold text-primary-600">#{currentUserRank}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {user?.totalPoints} points • Level {user?.level}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <select
                  value={filters.institution}
                  onChange={(e) => handleFilterChange('institution', e.target.value)}
                  className="form-select"
                >
                  <option value="">All Institutions</option>
                  <option value={user?.institution}>{user?.institution} (My Institution)</option>
                </select>
              </div>
              <button
                onClick={() => setFilters({ institution: '', page: 1 })}
                className="btn-outline"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && currentPage === 1 && (
          <div className="mb-8">
            <div className="flex justify-center items-end space-x-4 mb-8">
              {/* Second Place */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <span className="text-white text-xl font-bold">
                    {leaderboard[1]?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 h-24 flex flex-col justify-center">
                  <Medal className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <div className="font-semibold text-gray-900 text-sm">{leaderboard[1]?.name}</div>
                  <div className="text-xs text-gray-600">{leaderboard[1]?.totalPoints} pts</div>
                </div>
              </div>

              {/* First Place */}
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <span className="text-white text-2xl font-bold">
                    {leaderboard[0]?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 h-32 flex flex-col justify-center">
                  <Crown className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="font-bold text-gray-900">{leaderboard[0]?.name}</div>
                  <div className="text-sm text-gray-600">{leaderboard[0]?.totalPoints} pts</div>
                  <div className="text-xs text-gray-500">{leaderboard[0]?.institution}</div>
                </div>
              </div>

              {/* Third Place */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <span className="text-white text-xl font-bold">
                    {leaderboard[2]?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 h-20 flex flex-col justify-center">
                  <Award className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                  <div className="font-semibold text-gray-900 text-sm">{leaderboard[2]?.name}</div>
                  <div className="text-xs text-gray-600">{leaderboard[2]?.totalPoints} pts</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Rankings
              </h2>
              <div className="text-sm text-gray-500">
                {total} total participants
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text="Loading rankings..." />
              </div>
            ) : leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Institution
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Badges
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard.map((entry, index) => (
                      <tr 
                        key={entry._id} 
                        className={`hover:bg-gray-50 ${entry._id === user?.id ? 'bg-primary-50 border-primary-200' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${getRankBadgeColor(entry.rank)}`}>
                              {entry.rank <= 3 ? (
                                entry.rank === 1 ? <Crown className="h-4 w-4" /> :
                                entry.rank === 2 ? <Medal className="h-4 w-4" /> :
                                <Award className="h-4 w-4" />
                              ) : (
                                entry.rank
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-primary-600">
                                {entry.name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {entry.name}
                                {entry._id === user?.id && (
                                  <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.institution}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.totalPoints.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-900">{entry.level}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {entry.badges?.slice(0, 3).map((badge, badgeIndex) => (
                              <div
                                key={badgeIndex}
                                className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center"
                                title={badge.name}
                              >
                                <Award className="h-3 w-3 text-yellow-600" />
                              </div>
                            ))}
                            {entry.badges?.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{entry.badges.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No participants found
                </h3>
                <p className="text-gray-600">
                  {filters.institution 
                    ? 'No participants found for the selected institution.'
                    : 'Be the first to earn points and appear on the leaderboard!'}
                </p>
              </div>
            )}
          </div>
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
      </div>
    </div>
  );
};

export default LeaderboardPage;
