import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout Components
import Layout from './components/common/Layout';
import AdminLayout from './components/admin/AdminLayout';

// Public Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User Pages
import Dashboard from './pages/user/Dashboard';
import ResourcesPage from './pages/user/ResourcesPage';
import ResourceDetailPage from './pages/user/ResourceDetailPage';
import QuizzesPage from './pages/user/QuizzesPage';
import QuizDetailPage from './pages/user/QuizDetailPage';
import QuizAttemptPage from './pages/user/QuizAttemptPage';
import LeaderboardPage from './pages/user/LeaderboardPage';
import AlertsPage from './pages/user/AlertsPage';
import DrillsPage from './pages/user/DrillsPage';
import CommunityPage from './pages/user/CommunityPage';
import ChatbotPage from './pages/user/ChatbotPage';
import ProfilePage from './pages/user/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminResources from './pages/admin/AdminResources';
import AdminQuizzes from './pages/admin/AdminQuizzes';
import AdminDrills from './pages/admin/AdminDrills';
import AdminAlerts from './pages/admin/AdminAlerts';

// Route Guards
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Error Pages
import NotFoundPage from './pages/NotFoundPage';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<LoginPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                </Route>

                {/* Protected User Routes */}
                <Route path="/app" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="resources" element={<ResourcesPage />} />
                  <Route path="resources/:id" element={<ResourceDetailPage />} />
                  <Route path="quizzes" element={<QuizzesPage />} />
                  <Route path="quizzes/:id" element={<QuizDetailPage />} />
                  <Route path="quizzes/:id/attempt" element={<QuizAttemptPage />} />
                  <Route path="leaderboard" element={<LeaderboardPage />} />
                  <Route path="alerts" element={<AlertsPage />} />
                  <Route path="drills" element={<DrillsPage />} />
                  <Route path="community" element={<CommunityPage />} />
                  <Route path="chatbot" element={<ChatbotPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="resources" element={<AdminResources />} />
                  <Route path="quizzes" element={<AdminQuizzes />} />
                  <Route path="drills" element={<AdminDrills />} />
                  <Route path="alerts" element={<AdminAlerts />} />
                </Route>

                {/* 404 Page */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              {/* Global Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#374151',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '12px 16px',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
