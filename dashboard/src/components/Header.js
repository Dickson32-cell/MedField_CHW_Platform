import React from 'react';

const Header = ({ user }) => {
  return (
    <header className="header">
      <div className="header-title">
        <h1>Dashboard</h1>
      </div>

      <div className="header-actions">
        <div className="user-info">
          <div className="avatar">
            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
          </div>
          <div>
            <strong>{user?.first_name} {user?.last_name}</strong>
            <br />
            <small style={{ color: '#888' }}>{user?.role}</small>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
