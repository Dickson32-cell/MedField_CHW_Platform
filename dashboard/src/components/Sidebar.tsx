import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { User } from '../types';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/patients', label: 'Patients', icon: '👥' },
    { path: '/chws', label: 'CHWs', icon: '👨‍⚕️' },
    { path: '/visits', label: 'Visits', icon: '📅' },
    { path: '/tasks', label: 'Tasks', icon: '✅' },
    { path: '/referrals', label: 'Referrals', icon: '🏥' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/map', label: 'Map View', icon: '🗺️' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>MedField</h2>
        <p>Supervisor Dashboard</p>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
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
      
      <div className="sidebar-footer">
        {user && (
          <div className="user-info">
            <p>{user.first_name} {user.last_name}</p>
            <p className="user-role">{user.role}</p>
          </div>
        )}
        <button className="btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
