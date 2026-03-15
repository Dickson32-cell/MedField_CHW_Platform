import React, { useState } from 'react';
import { authService } from '../services/api';
import type { User } from '../types';

interface LoginProps {
  onLogin: (token: string, user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(username, password);

      if (response.success && response.data) {
        onLogin(response.data.accessToken, response.data.user);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <h1>MedField</h1>
          <p>CHW Platform</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 20, padding: 12, background: '#ffebee', color: '#c62828', borderRadius: 6 }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
