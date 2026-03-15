import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import './CHWProfile.css';

const CHWProfile: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'chw': return 'Community Health Worker';
      case 'admin': return 'Administrator';
      case 'supervisor': return 'Supervisor';
      default: return role;
    }
  };

  return (
    <div className="chw-profile">
      <div className="page-header">
        <Link to="/chw" className="back-link">← Back</Link>
        <h1>My Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar">
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </div>
        <div className="profile-info">
          <h2>{user?.first_name} {user?.last_name}</h2>
          <span className="role-badge">{getRoleDisplay(user?.role || '')}</span>
          <span className="status-badge">{user?.is_active ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      {/* Details Section */}
      <div className="details-section">
        <h3>Personal Information</h3>
        
        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Username</span>
            <span className="detail-value">{user?.username}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email</span>
            <span className="detail-value">{user?.email}</span>
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-label">Phone</span>
            <span className="detail-value">{user?.phone || 'Not provided'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">User ID</span>
            <span className="detail-value user-id">{user?.id}</span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="details-section">
        <h3>Account Statistics</h3>
        
        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-icon">📅</span>
            <span className="stat-label">Member Since</span>
            <span className="stat-value">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="stat-box">
            <span className="stat-icon">🔄</span>
            <span className="stat-label">Last Updated</span>
            <span className="stat-value">
              {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="profile-actions">
        <button 
          className="btn-logout"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <span className="logout-icon">🚪</span>
          Logout
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">🚪</div>
            <h3>Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-confirm"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CHWProfile;
