import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './CHWNavigation.css';

const CHWNavigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/chw', label: 'Home', icon: '🏠' },
    { path: '/chw/tasks', label: 'Tasks', icon: '✅' },
    { path: '/chw/patients', label: 'Patients', icon: '👥' },
    { path: '/chw/profile', label: 'Profile', icon: '👤' },
  ];

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
    </nav>
  );
};

export default CHWNavigation;
