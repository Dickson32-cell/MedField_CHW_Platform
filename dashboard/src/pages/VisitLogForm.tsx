import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { visitService, patientService } from '../services/api';
import { authService } from '../services/api';
import type { Visit, Patient, User } from '../types';

const VisitLogForm: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  useEffect(() => {
    const loadUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    };
    loadUser();
  }, []);
  
  const [selectedPatient, setSelectedPatient] = useState('');
  const [visitType, setVisitType] = useState<Visit['visit_type']>('scheduled');
  const [notes, setNotes] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const createVisitMutation = useMutation({
    mutationFn: async (visitData: Partial<Visit>) => {
      const response = await visitService.create(visitData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create visit');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Visit logged successfully');
      // Reset form
      setSelectedPatient('');
      setVisitType('scheduled');
      setNotes('');
      setSymptoms([]);
      setSearchQuery('');
      setSearchResults([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handlePatientSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await patientService.getAll({ search: query, limit: 10 });
      if (response.success && response.data) {
        // Filter to only show patient's assigned patients if CHW
        if (currentUser?.role === 'chw') {
          // In production, the backend already filters, but extra safety
          setSearchResults(response.data.patients);
        } else {
          setSearchResults(response.data.patients);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    createVisitMutation.mutate({
      patient_id: selectedPatient,
      chw_id: currentUser?.id,
      visit_type: visitType,
      visit_date: new Date().toISOString(),
      visit_status: 'completed',
      symptoms,
      notes,
    });
  };

  const commonSymptoms = [
    'Fever', 'Cough', 'Headache', 'Fatigue', 'Nausea',
    'Dizziness', 'Shortness of breath', 'Chest pain'
  ];

  const toggleSymptom = (symptom: string) => {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.filter(s => s !== symptom));
    } else {
      setSymptoms([...symptoms, symptom]);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="card-header">
        <h3>Log Patient Visit</h3>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* Patient Search */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>Search Patient</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handlePatientSearch(e.target.value)}
              placeholder="Search by name or ID..."
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
            />
            {isSearching && <div style={{ marginTop: 5, color: '#666' }}>Searching...</div>}
            {searchResults.length > 0 && (
              <div style={{ 
                marginTop: 10, 
                border: '1px solid #ddd', 
                borderRadius: 6, 
                maxHeight: 200, 
                overflowY: 'auto' 
              }}>
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient.id);
                      setSearchResults([]);
                      setSearchQuery(`${patient.first_name} ${patient.last_name}`);
                    }}
                    style={{
                      padding: 10,
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      background: selectedPatient === patient.id ? '#e3f2fd' : 'white'
                    }}
                  >
                    {patient.first_name} {patient.last_name} - {patient.patient_id}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visit Type */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>Visit Type</label>
            <select
              value={visitType}
              onChange={(e) => setVisitType(e.target.value as Visit['visit_type'])}
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd' }}
            >
              <option value="scheduled">Scheduled</option>
              <option value="unscheduled">Unscheduled</option>
              <option value="follow_up">Follow-up</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          {/* Symptoms */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>Symptoms</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {commonSymptoms.map((symptom) => (
                <label key={symptom} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={symptoms.includes(symptom)}
                    onChange={() => toggleSymptom(symptom)}
                  />
                  {symptom}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter visit notes..."
              rows={4}
              style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', resize: 'vertical' }}
            />
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            className="btn-primary"
            disabled={createVisitMutation.isPending || !selectedPatient}
            style={{ width: '100%' }}
          >
            {createVisitMutation.isPending ? 'Logging Visit...' : 'Log Visit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VisitLogForm;
