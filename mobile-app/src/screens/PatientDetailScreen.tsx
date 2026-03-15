import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { patientApiService } from '../services/api';
import type { RootStackParamList, Patient } from '../types';

type PatientDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'PatientDetail'>;

const PatientDetailScreen: React.FC<PatientDetailScreenProps> = ({ route, navigation }) => {
  const { patientId } = route.params || {};
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const loadPatient = async (): Promise<void> => {
    if (!patientId) return;
    
    setLoading(true);
    const result = await patientApiService.getById(patientId);
    if (result.success && result.data) {
      setPatient(result.data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading patient details...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.container}>
        <Text>Patient not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{patient.first_name} {patient.last_name}</Text>
          <Text style={styles.patientId}>ID: {patient.patient_id}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date of Birth:</Text>
          <Text style={styles.infoValue}>{patient.date_of_birth}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Gender:</Text>
          <Text style={styles.infoValue}>{patient.gender}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{patient.phone || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Risk Score:</Text>
          <Text style={[styles.infoValue, patient.risk_score >= 5 && styles.highRisk]}>
            {patient.risk_score}
          </Text>
        </View>
        {patient.is_pregnant && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pregnancy:</Text>
            <Text style={styles.infoValue}>Yes {patient.due_date && `(Due: ${patient.due_date})`}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('NewVisit', { patientId: patient.id, patientName: `${patient.first_name} ${patient.last_name}` })}
        >
          <Icon name="add-circle" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>New Visit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Visits', { patientId: patient.id })}
        >
          <Icon name="history" size={24} color="#2196F3" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>View History</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  headerInfo: {
    marginLeft: 20
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  patientId: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  infoLabel: {
    fontSize: 14,
    color: '#666'
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  highRisk: {
    color: '#F44336'
  },
  actions: {
    padding: 15
  },
  actionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196F3'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10
  },
  secondaryButtonText: {
    color: '#2196F3'
  }
});

export default PatientDetailScreen;
