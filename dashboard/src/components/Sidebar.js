import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ user, onLogout }) => {
  const navItems = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/patients', icon: '👥', label: 'Patients' },
    { path: '/chws', icon: '👨‍⚕️', label: 'CHWs' },
    { path: '/visits', icon: '📅', label: 'Visits' },
    { path: '/tasks', icon: '📝', label: 'Tasks' },
    { path: '/referrals', icon: '🏥', label: 'Referrals' },
    { path: '/map', icon: '🗺️', label: 'Map View' },
    { path: '/reports', icon: '📈', label: 'Reports' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>MedField</h2>
        <p>Supervisor Dashboard</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span style={{ marginRight: 12, fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <span style={{ marginRight: 8 }}>🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
