import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { userService } from '../services/api';

const CHWs = () => {
  const [chws, setChws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCHWs();
  }, []);

  const loadCHWs = async () => {
    try {
      const result = await userService.getCHWs();
      if (result.success) {
        setChws(result.data);
      }
    } catch (error) {
      console.error('Error loading CHWs:', error);
    }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    const result = await userService.approveUser(id);
    if (result.success) {
      loadCHWs();
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = window.prompt('Enter new password (min 6 chars):');
    if (newPassword && newPassword.length >= 6) {
      const result = await userService.resetPassword(id, { new_password: newPassword });
      if (result.success) {
        alert('Password reset successfully');
      }
    }
  };

  const handleDeactivate = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this staff member?')) {
      const result = await userService.deactivate(id);
      if (result.success) {
        loadCHWs();
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading CHWs...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>Community Health Workers</h3>
          <button className="btn btn-sm btn-primary">+ Add CHW</button>
        </div>
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Status</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {chws.map((chw) => (
                <tr key={chw.id}>
                  <td>{chw.first_name} {chw.last_name}</td>
                  <td>{chw.phone}</td>
                  <td>{chw.location?.lat?.toFixed(4)}, {chw.location?.lng?.toFixed(4)}</td>
                  <td>
                    {chw.is_approved ? (
                      <span className={`badge ${chw.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {chw.is_active ? 'Active' : 'Inactive'}
                      </span>
                    ) : (
                      <span className="badge badge-warning">Pending Approval</span>
                    )}
                  </td>
                  <td>{new Date(chw.last_login || chw.createdAt).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {!chw.is_approved && (
                        <button className="btn btn-sm btn-success" onClick={() => handleApprove(chw.id)}>Approve</button>
                      )}
                      <button className="btn btn-sm btn-outline" onClick={() => handleResetPassword(chw.id)}>Reset PW</button>
                      <button
                        className={`btn btn-sm ${chw.is_active ? 'btn-danger' : 'btn-outline'}`}
                        onClick={() => handleDeactivate(chw.id)}
                        disabled={!chw.is_active}
                      >
                        {chw.is_active ? 'Deactivate' : 'Disabled'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CHWs;
