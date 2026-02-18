import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Referrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/referrals', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 }
      });
      if (response.data.success) {
        setReferrals(response.data.data.referrals);
      }
    } catch (error) {
      console.error('Error loading referrals:', error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'completed': return 'badge-success';
      case 'not_completed': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  if (loading) {
    return <div className="loading">Loading referrals...</div>;
  }

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
                <th>Ref #</th>
                <th>Patient</th>
                <th>Facility</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((referral) => (
                <tr key={referral.id}>
                  <td>{referral.referral_number}</td>
                  <td>{referral.patient?.first_name} {referral.patient?.last_name}</td>
                  <td>{referral.referred_to_facility}</td>
                  <td>{referral.referral_reason.substring(0, 50)}...</td>
                  <td>{new Date(referral.referral_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(referral.status)}`}>
                      {referral.status}
                    </span>
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

export default Referrals;
