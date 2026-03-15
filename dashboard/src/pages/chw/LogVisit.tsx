import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMyPatients, useCreateVisit } from '../../hooks/useQueries';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import './LogVisit.css';

interface VisitFormData {
  patient_id: string;
  visit_type: 'scheduled' | 'unscheduled' | 'follow_up' | 'emergency';
  visit_date: string;
  temperature?: number;
  blood_pressure?: string;
  heart_rate?: number;
  respiratory_rate?: number;
  weight?: number;
  height?: number;
  symptoms: string[];
  notes: string;
}

const LogVisit: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');
  const createVisit = useCreateVisit();
  
  const { data: patientsData } = useMyPatients({});
  const patients = patientsData?.patients || [];

  const [formData, setFormData] = useState<VisitFormData>({
    patient_id: '',
    visit_type: 'scheduled',
    visit_date: new Date().toISOString().split('T')[0],
    symptoms: [],
    notes: '',
  });

  const [currentSymptom, setCurrentSymptom] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If taskId is provided, pre-select the patient
    if (taskId) {
      // In a real app, you'd fetch the task details and get the patient_id
      // For now, we'll leave it empty for the user to select
    }
  }, [taskId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id) {
      toast.error('Please select a patient');
      return;
    }

    setIsSubmitting(true);

    try {
      const visitData = {
        ...formData,
        chw_id: user?.id,
        vitals: {
          temperature: formData.temperature,
          blood_pressure: formData.blood_pressure,
          heart_rate: formData.heart_rate,
          respiratory_rate: formData.respiratory_rate,
          weight: formData.weight,
          height: formData.height,
        },
      };

      await createVisit.mutateAsync(visitData);
      toast.success('Visit logged successfully!');
      navigate('/chw');
    } catch (error) {
      toast.error('Failed to log visit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSymptom = () => {
    if (currentSymptom.trim() && !formData.symptoms.includes(currentSymptom.trim())) {
      setFormData({
        ...formData,
        symptoms: [...formData.symptoms, currentSymptom.trim()],
      });
      setCurrentSymptom('');
    }
  };

  const removeSymptom = (symptom: string) => {
    setFormData({
      ...formData,
      symptoms: formData.symptoms.filter((s) => s !== symptom),
    });
  };

  const commonSymptoms = [
    'Fever', 'Cough', 'Headache', 'Fatigue', 'Nausea', 
    'Body Pain', 'Shortness of Breath', 'Dizziness'
  ];

  return (
    <div className="log-visit">
      <div className="page-header">
        <Link to="/chw" className="back-link">← Back</Link>
        <h1>Log Visit</h1>
      </div>

      <form onSubmit={handleSubmit} className="visit-form">
        {/* Patient Selection */}
        <div className="form-section">
          <label className="section-label">Select Patient *</label>
          <select
            value={formData.patient_id}
            onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
            required
            className="patient-select"
          >
            <option value="">Choose a patient...</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name} - {patient.patient_id}
              </option>
            ))}
          </select>
        </div>

        {/* Visit Type */}
        <div className="form-section">
          <label className="section-label">Visit Type *</label>
          <div className="visit-type-grid">
            {[
              { value: 'scheduled', label: 'Scheduled', icon: '📅' },
              { value: 'unscheduled', label: 'Unscheduled', icon: '🚶' },
              { value: 'follow_up', label: 'Follow Up', icon: '🔄' },
              { value: 'emergency', label: 'Emergency', icon: '🚨' },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                className={`type-btn ${formData.visit_type === type.value ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, visit_type: type.value as any })}
              >
                <span className="type-icon">{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visit Date */}
        <div className="form-section">
          <label className="section-label">Visit Date *</label>
          <input
            type="date"
            value={formData.visit_date}
            onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
            required
            className="date-input"
          />
        </div>

        {/* Vitals */}
        <div className="form-section">
          <label className="section-label">Vitals</label>
          <div className="vitals-grid">
            <div className="vital-input">
              <label>Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                placeholder="36.5"
                value={formData.temperature || ''}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              />
            </div>
            <div className="vital-input">
              <label>Blood Pressure</label>
              <input
                type="text"
                placeholder="120/80"
                value={formData.blood_pressure || ''}
                onChange={(e) => setFormData({ ...formData, blood_pressure: e.target.value })}
              />
            </div>
            <div className="vital-input">
              <label>Heart Rate (bpm)</label>
              <input
                type="number"
                placeholder="72"
                value={formData.heart_rate || ''}
                onChange={(e) => setFormData({ ...formData, heart_rate: parseInt(e.target.value) })}
              />
            </div>
            <div className="vital-input">
              <label>Respiratory Rate</label>
              <input
                type="number"
                placeholder="16"
                value={formData.respiratory_rate || ''}
                onChange={(e) => setFormData({ ...formData, respiratory_rate: parseInt(e.target.value) })}
              />
            </div>
            <div className="vital-input">
              <label>Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="65.0"
                value={formData.weight || ''}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
              />
            </div>
            <div className="vital-input">
              <label>Height (cm)</label>
              <input
                type="number"
                placeholder="170"
                value={formData.height || ''}
                onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Symptoms */}
        <div className="form-section">
          <label className="section-label">Symptoms</label>
          
          <div className="symptoms-input">
            <input
              type="text"
              placeholder="Add a symptom..."
              value={currentSymptom}
              onChange={(e) => setCurrentSymptom(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
            />
            <button type="button" className="btn-add" onClick={addSymptom}>
              +
            </button>
          </div>

          <div className="common-symptoms">
            <span className="common-label">Common:</span>
            {commonSymptoms.map((symptom) => (
              <button
                key={symptom}
                type="button"
                className={`symptom-chip ${formData.symptoms.includes(symptom) ? 'selected' : ''}`}
                onClick={() => {
                  if (formData.symptoms.includes(symptom)) {
                    removeSymptom(symptom);
                  } else {
                    setFormData({ ...formData, symptoms: [...formData.symptoms, symptom] });
                  }
                }}
              >
                {symptom}
              </button>
            ))}
          </div>

          {formData.symptoms.length > 0 && (
            <div className="selected-symptoms">
              {formData.symptoms.map((symptom) => (
                <span key={symptom} className="symptom-tag">
                  {symptom}
                  <button type="button" onClick={() => removeSymptom(symptom)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="form-section">
          <label className="section-label">Notes</label>
          <textarea
            rows={4}
            placeholder="Add any additional notes about the visit..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-submit"
            disabled={isSubmitting || !formData.patient_id}
          >
            {isSubmitting ? 'Saving...' : 'Log Visit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogVisit;
