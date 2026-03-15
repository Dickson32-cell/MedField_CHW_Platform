import React from 'react';
import { useCHWs } from '../hooks/useQueries';
import { SkeletonPage } from '../components/SkeletonLoader';
import type { User } from '../types';

const CHWs: React.FC = () => {
  const { data: chws, isLoading, error } = useCHWs();

  if (isLoading) {
    return <SkeletonPage />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="alert alert-danger">
          Error loading CHWs: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>Community Health Workers</h3>
        </div>
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {chws && chws.length > 0 ? (
                chws.map((chw: User) => (
                  <tr key={chw.id}>
                    <td>{chw.first_name} {chw.last_name}</td>
                    <td>{chw.username}</td>
                    <td>{chw.email}</td>
                    <td>{chw.phone}</td>
                    <td>
                      <span className={`badge ${chw.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {chw.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                    No CHWs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CHWs;
