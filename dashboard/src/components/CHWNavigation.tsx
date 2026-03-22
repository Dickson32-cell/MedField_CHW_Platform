import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './CHWNavigation.css';

const CHWNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: '/chw', label: 'Home', icon: '🏠' },
    { path: '/chw/tasks', label: 'Tasks', icon: '✅' },
    { path: '/chw/patients', label: 'Patients', icon: '👥' },
    { path: '/chw/profile', label: 'Profile', icon: '👤' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="chw-navigation">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </Link>
      ))}
      <button 
        className="nav-item nav-logout" 
        onClick={handleLogout}
        title="Logout"
      >
        <span className="nav-icon">🚪</span>
        <span className="nav-label">Logout</span>
      </button>
    </nav>
  );
};

export default CHWNavigation;
