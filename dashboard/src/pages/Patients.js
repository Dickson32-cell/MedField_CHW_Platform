import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/patients', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, limit: 50 }
      });
      if (response.data.success) {
        setPatients(response.data.data.patients);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="loading">Loading patients...</div>;
  }

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
              onKeyPress={(e) => e.key === 'Enter' && loadPatients()}
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
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>{patient.patient_id}</td>
                    <td>{patient.first_name} {patient.last_name}</td>
                    <td>{patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'}</td>
                    <td>{patient.gender}</td>
                    <td>
                      <span className={`badge ${patient.risk_score >= 5 ? 'badge-danger' : 'badge-success'}`}>
                        {patient.risk_score}
                      </span>
                    </td>
                    <td>
                      {patient.is_pregnant && <span className="badge badge-info" style={{ marginRight: 5 }}>Pregnant</span>}
                      <span className="badge badge-success">{patient.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Patients;
