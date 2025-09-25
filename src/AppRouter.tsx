import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './pages/Dashboard';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminPage } from './pages/AdminPage';
import Users from './pages/Users';
import BaseMapPage from './pages/BaseMapPage';
import { useAuth } from './hooks/useAuth';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/analytics"
        element={
          isAuthenticated ? <AnalyticsPage /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/admin"
        element={
          isAuthenticated ? <AdminPage /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/users"
        element={
          isAuthenticated ? <Users /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/basemap"
        element={
          isAuthenticated ? <BaseMapPage /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />
      <Route
        path="*"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />
    </Routes>
  );
};

const AppRouter: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
};

export default AppRouter;