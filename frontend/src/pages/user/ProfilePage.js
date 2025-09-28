import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Settings, 
  Bell, 
  Award, 
  Trophy, 
  MapPin,
  Mail,
  Building,
  Lock,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { isSubscribed, subscribe, unsubscribe, sendTestNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      institution: user?.institution || '',
      city: user?.city || '',
      state: user?.state || '',
      notifications: {
        alerts: user?.notifications?.alerts ?? true,
        quizzes: user?.notifications?.quizzes ?? true,
        drills: user?.notifications?.drills ?? true
      }
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting }
  } = useForm();

  const onProfileSubmit = async (data) => {
    const result = await updateProfile(data);
    if (result.success) {
      toast.success('Profile updated successfully!');
    }
  };

  const onPasswordSubmit = async (data) => {
    const result = await changePassword(data.currentPassword, data.newPassword);
    if (result.success) {
      resetPasswordForm();
      toast.success('Password changed successfully!');
    }
  };

  const handleNotificationToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'achievements', name: 'Achievements', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 flex items-center">
            <Settings className="h-8 w-8 text-primary-600 mr-3" />
            Profile & Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-body">
                {/* User Info */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  <div className="flex items-center justify-center space-x-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Trophy className="h-4 w-4" />
                      <span>Level {user?.level}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="h-4 w-4" />
                      <span>{user?.totalPoints} pts</span>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="card-body">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Profile Information
                    </h2>
                    
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="form-label">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              {...registerProfile('name', {
                                required: 'Name is required'
                              })}
                              type="text"
                              className={`form-input pl-10 ${profileErrors.name ? 'border-red-300' : ''}`}
                            />
                          </div>
                          {profileErrors.name && (
                            <p className="form-error">{profileErrors.name.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="form-label">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="email"
                              value={user?.email}
                              disabled
                              className="form-input pl-10 bg-gray-50 cursor-not-allowed"
                            />
                          </div>
                          <p className="form-help">Email cannot be changed</p>
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Institution</label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            {...registerProfile('institution', {
                              required: 'Institution is required'
                            })}
                            type="text"
                            className={`form-input pl-10 ${profileErrors.institution ? 'border-red-300' : ''}`}
                          />
                        </div>
                        {profileErrors.institution && (
                          <p className="form-error">{profileErrors.institution.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="form-label">City</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              {...registerProfile('city', {
                                required: 'City is required'
                              })}
                              type="text"
                              className={`form-input pl-10 ${profileErrors.city ? 'border-red-300' : ''}`}
                            />
                          </div>
                          {profileErrors.city && (
                            <p className="form-error">{profileErrors.city.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="form-label">State</label>
                          <select
                            {...registerProfile('state', {
                              required: 'State is required'
                            })}
                            className={`form-select ${profileErrors.state ? 'border-red-300' : ''}`}
                          >
                            <option value="">Select State</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Rajasthan">Rajasthan</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="West Bengal">West Bengal</option>
                            <option value="Punjab">Punjab</option>
                            <option value="Haryana">Haryana</option>
                            <option value="Other">Other</option>
                          </select>
                          {profileErrors.state && (
                            <p className="form-error">{profileErrors.state.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <button
                          type="submit"
                          disabled={isProfileSubmitting}
                          className="btn-primary flex items-center"
                        >
                          {isProfileSubmitting ? (
                            <>
                              <LoadingSpinner size="sm" color="white" className="mr-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Notification Preferences
                    </h2>

                    <div className="space-y-6">
                      {/* Push Notifications */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">Push Notifications</h3>
                            <p className="text-sm text-gray-600">
                              Receive instant notifications in your browser
                            </p>
                          </div>
                          <button
                            onClick={handleNotificationToggle}
                            className={`btn ${isSubscribed ? 'btn-danger' : 'btn-primary'}`}
                          >
                            {isSubscribed ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                        {isSubscribed && (
                          <button
                            onClick={handleTestNotification}
                            className="btn-outline btn-sm"
                          >
                            Send Test Notification
                          </button>
                        )}
                      </div>

                      {/* Email Preferences */}
                      <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                        <div className="space-y-4">
                          <h3 className="font-medium text-gray-900">Email Notifications</h3>
                          
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <input
                                {...registerProfile('notifications.alerts')}
                                type="checkbox"
                                className="form-checkbox"
                              />
                              <div className="ml-3">
                                <label className="text-sm font-medium text-gray-900">
                                  Disaster Alerts
                                </label>
                                <p className="text-xs text-gray-500">
                                  Get notified about disaster alerts in your area
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <input
                                {...registerProfile('notifications.quizzes')}
                                type="checkbox"
                                className="form-checkbox"
                              />
                              <div className="ml-3">
                                <label className="text-sm font-medium text-gray-900">
                                  New Quizzes
                                </label>
                                <p className="text-xs text-gray-500">
                                  Be notified when new quizzes are available
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <input
                                {...registerProfile('notifications.drills')}
                                type="checkbox"
                                className="form-checkbox"
                              />
                              <div className="ml-3">
                                <label className="text-sm font-medium text-gray-900">
                                  Drill Reminders
                                </label>
                                <p className="text-xs text-gray-500">
                                  Get reminders about upcoming disaster drills
                                </p>
                              </div>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isProfileSubmitting}
                            className="btn-primary flex items-center"
                          >
                            {isProfileSubmitting ? (
                              <>
                                <LoadingSpinner size="sm" color="white" className="mr-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Preferences
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Security Settings
                    </h2>

                    <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                      <div>
                        <label className="form-label">Current Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            {...registerPassword('currentPassword', {
                              required: 'Current password is required'
                            })}
                            type={showCurrentPassword ? 'text' : 'password'}
                            className={`form-input pl-10 pr-10 ${passwordErrors.currentPassword ? 'border-red-300' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="form-error">{passwordErrors.currentPassword.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="form-label">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            {...registerPassword('newPassword', {
                              required: 'New password is required',
                              minLength: {
                                value: 6,
                                message: 'Password must be at least 6 characters'
                              }
                            })}
                            type={showNewPassword ? 'text' : 'password'}
                            className={`form-input pl-10 pr-10 ${passwordErrors.newPassword ? 'border-red-300' : ''}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.newPassword && (
                          <p className="form-error">{passwordErrors.newPassword.message}</p>
                        )}
                      </div>

                      <div>
                        <button
                          type="submit"
                          disabled={isPasswordSubmitting}
                          className="btn-primary flex items-center"
                        >
                          {isPasswordSubmitting ? (
                            <>
                              <LoadingSpinner size="sm" color="white" className="mr-2" />
                              Changing...
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" />
                              Change Password
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Achievements Tab */}
                {activeTab === 'achievements' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Your Achievements
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Stats */}
                      <div className="space-y-4">
                        <div className="bg-gradient-primary rounded-lg p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold">{user?.totalPoints}</div>
                              <div className="text-primary-100">Total Points</div>
                            </div>
                            <Trophy className="h-8 w-8 text-primary-200" />
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-4 text-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-bold">{user?.level}</div>
                              <div className="text-yellow-100">Current Level</div>
                            </div>
                            <Award className="h-8 w-8 text-yellow-200" />
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div>
                        <h3 className="font-medium text-gray-900 mb-4">Earned Badges</h3>
                        {user?.badges && user.badges.length > 0 ? (
                          <div className="space-y-3">
                            {user.badges.map((badge, index) => (
                              <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                  <Award className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{badge.name}</div>
                                  <div className="text-sm text-gray-600">{badge.description}</div>
                                  <div className="text-xs text-gray-500">
                                    Earned on {new Date(badge.earnedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No badges earned yet</p>
                            <p className="text-sm text-gray-400">Complete quizzes and activities to earn badges!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
