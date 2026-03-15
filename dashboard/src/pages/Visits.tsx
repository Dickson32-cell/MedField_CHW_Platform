import React, { useState, useEffect } from 'react';
import { useVisits } from '../hooks/useQueries';
import { SkeletonPage } from '../components/SkeletonLoader';
import type { Visit, User } from '../types';
import { authService } from '../services/api';
import VisitLogForm from './VisitLogForm';

const Visits: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  useEffect(() => {
    const loadUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    };
    loadUser();
  }, []);
  
  const { data: visits, isLoading, error } = useVisits({ limit: 50 });
  const [showLogForm, setShowLogForm] = useState(false);
  
  // CHWs see the log form by default, others see the list
  const isCHW = currentUser?.role === 'chw';

  if (isLoading) {
    return <SkeletonPage />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="alert alert-danger">
          Error loading visits: {error.message}
        </div>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string): string => {
    return status === 'completed' ? 'badge-success' : 'badge-warning';
  };

  if (isCHW && !showLogForm) {
    return (
      <div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="card-body">
            <button className="btn-primary" onClick={() => setShowLogForm(true)}>
              Log New Visit
            </button>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3>My Recent Visits</h3>
          </div>
          <div className="card-body">
            <table>
              <thead>
                <tr>
                  <th>Visit #</th>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visits && visits.length > 0 ? (
                  visits.slice(0, 10).map((visit: Visit) => (
                    <tr key={visit.id}>
                      <td>{visit.visit_number}</td>
                      <td>
                        {visit.patient && `${visit.patient.first_name} ${visit.patient.last_name}`}
                      </td>
                      <td>{visit.visit_type}</td>
                      <td>{new Date(visit.visit_date).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(visit.visit_status)}`}>
                          {visit.visit_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                      No visits found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
  
  if (showLogForm) {
    return (
      <div>
        <button 
          className="btn-secondary" 
          onClick={() => setShowLogForm(false)}
          style={{ marginBottom: 20 }}
        >
          ← Back to Visits
        </button>
        <VisitLogForm />
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>All Visits</h3>
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
              {visits && visits.length > 0 ? (
                visits.map((visit: Visit) => (
                  <tr key={visit.id}>
                    <td>{visit.visit_number}</td>
                    <td>
                      {visit.patient && `${visit.patient.first_name} ${visit.patient.last_name}`}
                    </td>
                    <td>
                      {visit.chw && `${visit.chw.first_name} ${visit.chw.last_name}`}
                    </td>
                    <td>{visit.visit_type}</td>
                    <td>{new Date(visit.visit_date).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(visit.visit_status)}`}>
                        {visit.visit_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                    No visits found
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

export default Visits;
