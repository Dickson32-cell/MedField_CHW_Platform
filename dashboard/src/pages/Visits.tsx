import React from 'react';
import { useVisits } from '../hooks/useQueries';
import { SkeletonPage } from '../components/SkeletonLoader';
import type { Visit } from '../types';

const Visits: React.FC = () => {
  const { data: visits, isLoading, error } = useVisits({ limit: 50 });

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
