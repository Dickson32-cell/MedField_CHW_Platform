import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyPatients } from '../../hooks/useQueries';
import { SkeletonCard } from '../../components/SkeletonLoader';
import './CHWPatients.css';

const CHWPatients: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading } = useMyPatients({ search: searchQuery || undefined });

  const patients = data?.patients || [];

  const getRiskBadge = (riskScore: number) => {
    if (riskScore >= 75) return { label: 'High Risk', color: '#f44336', bg: '#FFEBEE' };
    if (riskScore >= 50) return { label: 'Medium Risk', color: '#ff9800', bg: '#FFF3E0' };
    return { label: 'Low Risk', color: '#4CAF50', bg: '#E8F5E9' };
  };

  return (
    <div className="chw-patients">
      <div className="page-header">
        <Link to="/chw" className="back-link">← Back</Link>
        <h1>My Patients</h1>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search patients by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-btn" onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {/* Patients List */}
      <div className="patients-container">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <h3>No patients found</h3>
            <p>{searchQuery ? 'Try a different search term' : 'No patients assigned to you yet'}</p>
          </div>
        ) : (
          patients.map((patient) => {
            const risk = getRiskBadge(patient.risk_score);
            return (
              <Link 
                key={patient.id} 
                to={`/chw/patients/${patient.id}`}
                className="patient-card"
              >
                <div className="patient-header">
                  <div className="patient-avatar">
                    {patient.first_name[0]}{patient.last_name[0]}
                  </div>
                  <div className="patient-main-info">
                    <h3>{patient.first_name} {patient.last_name}</h3>
                    <span className="patient-id">ID: {patient.patient_id}</span>
                  </div>
                  <span className="arrow">→</span>
                </div>

                <div className="patient-badges">
                  <span 
                    className="badge risk"
                    style={{ backgroundColor: risk.bg, color: risk.color }}
                  >
                    {risk.label}
                  </span>
                  {patient.is_pregnant && (
                    <span className="badge pregnant">
                      🤰 Pregnant
                    </span>
                  )}
                  {patient.chronic_conditions?.length > 0 && (
                    <span className="badge condition">
                      🏥 {patient.chronic_conditions.length} Conditions
                    </span>
                  )}
                </div>

                <div className="patient-details">
                  <div className="detail-item">
                    <span className="detail-icon">🎂</span>
                    <span>{new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">{patient.gender === 'female' ? '👩' : patient.gender === 'male' ? '👨' : '👤'}</span>
                    <span className="capitalize">{patient.gender}</span>
                  </div>
                  {patient.phone && (
                    <div className="detail-item">
                      <span className="detail-icon">📞</span>
                      <span>{patient.phone}</span>
                    </div>
                  )}
                </div>

                {patient.due_date && (
                  <div className="due-date">
                    <span className="due-icon">📅</span>
                    <span>Due: {new Date(patient.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CHWPatients;
