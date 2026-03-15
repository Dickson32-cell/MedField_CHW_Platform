import React from 'react';
import { useReferrals, useUpdateReferral } from '../hooks/useQueries';
import { SkeletonPage } from '../components/SkeletonLoader';
import type { Referral } from '../types';

const Referrals: React.FC = () => {
  const { data: referrals, isLoading, error } = useReferrals({ limit: 50 });
  const updateReferral = useUpdateReferral();

  if (isLoading) {
    return <SkeletonPage />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="alert alert-danger">
          Error loading referrals: {error.message}
        </div>
      </div>
    );
  }

  const getPriorityBadgeClass = (priority: string): string => {
    switch (priority) {
      case 'emergency': return 'badge-danger';
      case 'urgent': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'accepted': return 'badge-info';
      case 'rejected': return 'badge-danger';
      default: return 'badge-warning';
    }
  };

  const handleStatusChange = (referralId: string, newStatus: string) => {
    updateReferral.mutate({ id: referralId, data: { status: newStatus } });
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>Referrals</h3>
        </div>
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {referrals && referrals.length > 0 ? (
                referrals.map((referral: Referral) => (
                  <tr key={referral.id}>
                    <td>
                      {referral.patient && `${referral.patient.first_name} ${referral.patient.last_name}`}
                    </td>
                    <td>{referral.referral_type}</td>
                    <td>{referral.reason}</td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(referral.priority)}`}>
                        {referral.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(referral.status)}`}>
                        {referral.status}
                      </span>
                    </td>
                    <td>{new Date(referral.created_at || '').toLocaleDateString()}</td>
                    <td>
                      {referral.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleStatusChange(referral.id, 'accepted')}
                            disabled={updateReferral.isPending}
                            style={{ marginRight: 8 }}
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleStatusChange(referral.id, 'rejected')}
                            disabled={updateReferral.isPending}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                    No referrals found
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

export default Referrals;
