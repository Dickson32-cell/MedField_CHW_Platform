import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from './providers/QueryProvider';
import { useAuthStore, initializeAuth } from './store/authStore';

// Management Pages (Admin/Supervisor)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import CHWs from './pages/CHWs';
import Visits from './pages/Visits';
import Tasks from './pages/Tasks';
import Referrals from './pages/Referrals';
import Reports from './pages/Reports';
import MapView from './pages/MapView';

// CHW Pages (Mobile-friendly)
import CHWDashboard from './pages/chw/CHWDashboard';
import CHWTasks from './pages/chw/CHWTasks';
import CHWPatients from './pages/chw/CHWPatients';
import LogVisit from './pages/chw/LogVisit';
import CHWProfile from './pages/chw/CHWProfile';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CHWNavigation from './components/CHWNavigation';

import './App.css';

// Initialize auth BEFORE React renders
initializeAuth();

// Management Layout Component
const ManagementLayout: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="app-container">
      <Sidebar user={user} onLogout={logout} />
      <div className="main-content">
        <Header user={user} />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/chws" element={<CHWs />} />
            <Route path="/visits" element={<Visits />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/map" element={<MapView />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

// CHW Layout Component (Mobile-friendly)
const CHWLayout: React.FC = () => {
  return (
    <div className="chw-layout">
      <div className="chw-content">
        <Routes>
          <Route path="/" element={<CHWDashboard />} />
          <Route path="/tasks" element={<CHWTasks />} />
          <Route path="/patients" element={<CHWPatients />} />
          <Route path="/log-visit" element={<LogVisit />} />
          <Route path="/profile" element={<CHWProfile />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <CHWNavigation />
    </div>
  );
};

// Loading screen component
const LoadingScreen: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#f5f5f5'
  }}>
    <div style={{
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '4px solid #e0e0e0',
        borderTop: '4px solid #2196F3',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <p>Loading MedField...</p>
    </div>
  </div>
);

// Main App Component
const AppContent: React.FC = () => {
  const { isAuthenticated, user, login } = useAuthStore();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Re-initialize auth on mount (in case localStorage changed)
    initializeAuth();
    setAuthReady(true);
  }, []);

  const handleLogin = (token: string, userData: unknown) => {
    login(token, userData as any);
  };

  // Show loading until auth is ready
  if (!authReady) {
    return <LoadingScreen />;
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return (
      <QueryProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </QueryProvider>
    );
  }

  // Determine which layout to show based on role
  const isManagement = user?.role === 'admin' || user?.role === 'supervisor';
  const isCHW = user?.role === 'chw';

  return (
    <QueryProvider>
      <Router>
        <Routes>
          {/* Management Routes (Admin/Supervisor) */}
          {isManagement && (
            <Route path="/*" element={<ManagementLayout />} />
          )}
          
          {/* CHW Routes */}
          {isCHW && (
            <>
              <Route path="/chw/*" element={<CHWLayout />} />
              <Route path="*" element={<Navigate to="/chw" />} />
            </>
          )}
          
          {/* Fallback - if role doesn't match, redirect to appropriate dashboard */}
          {!isManagement && !isCHW && (
            <Route path="*" element={<Navigate to="/" />} />
          )}
        </Routes>
      </Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4CAF50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#F44336',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryProvider>
  );
};

function App() {
  return <AppContent />;
}

export default App;
