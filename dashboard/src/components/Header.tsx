import React from 'react';
import type { User } from '../types';

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="header">
      <div className="header-left">
        <h1>Dashboard</h1>
      </div>
      
      <div className="header-right">
        {user && (
          <div className="user-profile">
            <span>Welcome, {user.first_name}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
