import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from './providers/QueryProvider';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import CHWs from './pages/CHWs';
import Visits from './pages/Visits';
import Tasks from './pages/Tasks';
import Referrals from './pages/Referrals';
import Reports from './pages/Reports';
import MapView from './pages/MapView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (token: string, userData: unknown) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return (
      <QueryProvider>
        <Login onLogin={handleLogin} />
        <Toaster position="top-right" />
      </QueryProvider>
    );
  }

  return (
    <QueryProvider>
      <Router>
        <div className="app-container">
          <Sidebar user={user} onLogout={handleLogout} />
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
}

export default App;
