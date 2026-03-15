import React, { useState } from 'react';
import { usePatients } from '../hooks/useQueries';
import { SkeletonPage, SkeletonTable } from '../components/SkeletonLoader';
import type { Patient } from '../types';

const Patients: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data: patients, isLoading, error } = usePatients({ search, limit: 50 });

  if (isLoading) {
    return <SkeletonPage />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="alert alert-danger">
          Error loading patients: {error.message}
        </div>
      </div>
    );
  }

  const getRiskBadgeClass = (riskScore: number): string => {
    return riskScore >= 5 ? 'badge-danger' : 'badge-success';
  };

  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>Patients</h3>
          <div className="filters">
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}
            />
          </div>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {patients && patients.length > 0 ? (
                  patients.map((patient: Patient) => (
                    <tr key={patient.id}>
                      <td>{patient.patient_id}</td>
                      <td>{patient.first_name} {patient.last_name}</td>
                      <td>{calculateAge(patient.date_of_birth)}</td>
                      <td>{patient.gender}</td>
                      <td>
                        <span className={`badge ${getRiskBadgeClass(patient.risk_score)}`}>
                          {patient.risk_score}
                        </span>
                      </td>
                      <td>
                        {patient.is_pregnant && (
                          <span className="badge badge-info" style={{ marginRight: 5 }}>Pregnant</span>
                        )}
                        <span className="badge badge-success">
                          {patient.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                      No patients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Patients;
