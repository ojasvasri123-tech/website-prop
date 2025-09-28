import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add user ID to headers
api.interceptors.request.use(
  (config) => {
    try {
      const userData = localStorage.getItem('beacon_user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user && user.id) {
          config.headers['user-id'] = user.id;
        }
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      localStorage.removeItem('beacon_user');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear user data and redirect to login
      localStorage.removeItem('beacon_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  subscribePush: (data) => api.post('/auth/subscribe-push', data),
  getStats: () => api.get('/auth/stats'),
};

// User API
export const userAPI = {
  getDashboard: () => api.get('/user/dashboard'),
  getResources: (params) => api.get('/user/resources', { params }),
  getResource: (id) => api.get(`/user/resources/${id}`),
  likeResource: (id) => api.post(`/user/resources/${id}/like`),
  commentResource: (id, data) => api.post(`/user/resources/${id}/comments`, data),
  downloadResource: (id) => api.get(`/user/resources/${id}/download`, { responseType: 'blob' }),
  getAlerts: (params) => api.get('/user/alerts', { params }),
  getDrills: (params) => api.get('/user/drills', { params }),
  registerForDrill: (id) => api.post(`/user/drills/${id}/register`),
  getLeaderboard: (params) => api.get('/user/leaderboard', { params }),
  getQuizHistory: (params) => api.get('/user/quiz-history', { params }),
  getCommunity: (params) => api.get('/user/community', { params }),
};

// Quiz API
export const quizAPI = {
  getQuizzes: (params) => api.get('/quiz', { params }),
  getQuiz: (id) => api.get(`/quiz/${id}`),
  submitQuiz: (id, data) => api.post(`/quiz/${id}/submit`, data),
  getQuizAttempt: (id) => api.get(`/quiz/${id}/attempt`),
  getQuizLeaderboard: (id, params) => api.get(`/quiz/${id}/leaderboard`, { params }),
  getQuizStats: (id) => api.get(`/quiz/${id}/stats`),
  getCategories: () => api.get('/quiz/meta/categories'),
};

// Chatbot API
export const chatbotAPI = {
  sendMessage: (data) => api.post('/chatbot/chat', data),
  getHistory: (conversationId) => api.get(`/chatbot/history/${conversationId}`),
  clearHistory: (conversationId) => api.delete(`/chatbot/history/${conversationId}`),
  getSuggestions: () => api.get('/chatbot/suggestions'),
  getHealth: () => api.get('/chatbot/health'),
};

// Alerts API
export const alertsAPI = {
  getAlerts: (params) => api.get('/alerts', { params }),
  getMyLocationAlerts: (params) => api.get('/alerts/my-location', { params }),
  getAlert: (id) => api.get(`/alerts/${id}`),
  getAlertStats: () => api.get('/alerts/stats/overview'),
  getRecentAlerts: () => api.get('/alerts/recent/24h'),
  getAvailableCities: () => api.get('/alerts/cities/available'),
  getCityAlerts: (cityName, params) => api.get(`/alerts/city/${cityName}`, { params }),
  searchCityRealTime: (cityName) => api.get(`/alerts/search/${cityName}`),
  createAlert: (data) => api.post('/alerts', data),
  updateAlert: (id, data) => api.put(`/alerts/${id}`, data),
  deleteAlert: (id) => api.delete(`/alerts/${id}`),
  verifyAlert: (id) => api.post(`/alerts/${id}/verify`),
  testNotification: (id) => api.post(`/alerts/${id}/test-notification`),
  triggerScraping: () => api.post('/alerts/scrape'),
  getScrapingStatus: () => api.get('/alerts/scrape/status'),
};

// Community API
export const communityAPI = {
  getPosts: (params) => api.get('/community', { params }),
  getPost: (id) => api.get(`/community/${id}`),
  createPost: (data) => api.post('/community', data),
  updatePost: (id, data) => api.put(`/community/${id}`, data),
  deletePost: (id) => api.delete(`/community/${id}`),
  likePost: (id) => api.post(`/community/${id}/like`),
  addComment: (id, data) => api.post(`/community/${id}/comments`, data),
  removeComment: (postId, commentId) => api.delete(`/community/${postId}/comments/${commentId}`),
  getUserPosts: (userId, params) => api.get(`/community/user/${userId}`, { params }),
  getStats: () => api.get('/community/stats/overview'),
};

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (userId) => api.put(`/admin/users/${userId}/toggle-status`),
  
  // Resources
  getResources: (params) => api.get('/admin/resources', { params }),
  uploadResource: (data) => api.post('/admin/resources', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateResource: (id, data) => api.put(`/admin/resources/${id}`, data),
  deleteResource: (id) => api.delete(`/admin/resources/${id}`),
  
  // Quizzes
  getQuizzes: (params) => api.get('/admin/quizzes', { params }),
  createQuiz: (data) => api.post('/admin/quizzes', data),
  updateQuiz: (id, data) => api.put(`/admin/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/admin/quizzes/${id}`),
  
  // Drills
  getDrills: (params) => api.get('/admin/drills', { params }),
  createDrill: (data) => api.post('/admin/drills', data),
  updateDrill: (id, data) => api.put(`/admin/drills/${id}`, data),
  deleteDrill: (id) => api.delete(`/admin/drills/${id}`),
  
  // Alerts
  getAlerts: (params) => api.get('/admin/alerts', { params }),
  createAlert: (data) => api.post('/admin/alerts', data),
  updateAlert: (id, data) => api.put(`/admin/alerts/${id}`, data),
  deleteAlert: (id) => api.delete(`/admin/alerts/${id}`),
  triggerScraping: () => api.post('/alerts/scrape'),
  getScrapingStatus: () => api.get('/alerts/scrape/status'),
  sendTestNotification: (id) => api.post(`/alerts/${id}/test-notification`),
  verifyAlert: (id) => api.post(`/alerts/${id}/verify`),
  
  // AI Content Generation
  generateQuiz: (data) => api.post('/chatbot/generate-quiz', data),
  generateContent: (data) => api.post('/chatbot/generate-content', data),
};

// File upload helper
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post('/admin/resources', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;
