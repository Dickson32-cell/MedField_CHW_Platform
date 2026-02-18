import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Visits = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/visits', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 }
      });
      if (response.data.success) {
        setVisits(response.data.data.visits);
      }
    } catch (error) {
      console.error('Error loading visits:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="loading">Loading visits...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>Visits</h3>
        </div>
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>Visit #</th>
                <th>Patient</th>
                <th>CHW</th>
                <th>Type</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id}>
                  <td>{visit.visit_number}</td>
                  <td>{visit.patient?.first_name} {visit.patient?.last_name}</td>
                  <td>{visit.chw?.first_name} {visit.chw?.last_name}</td>
                  <td>{visit.visit_type}</td>
                  <td>{new Date(visit.visit_date).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${visit.visit_status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                      {visit.visit_status}
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

export default Visits;
