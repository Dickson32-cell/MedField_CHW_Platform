import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { visitApiService, protocolApiService } from '../services/api';

const NewVisitScreen = ({ navigation, route }) => {
  const { patientId, patientName } = route.params || {};

  const [formData, setFormData] = useState({
    patient_id: patientId || '',
    visit_type: 'scheduled',
    temperature: '',
    cough: false,
    diarrhea: false,
    fever: false,
    rdt_positive: false,
    fast_breathing: false,
    chest_indrawing: false,
    notes: ''
  });

  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkProtocol = async () => {
    setChecking(true);
    const result = await protocolApiService.assess({
      ...formData,
      temperature: parseFloat(formData.temperature)
    });
    setChecking(false);

    if (result.success) {
      setGuidance(result.data);
    } else {
      Alert.alert('Protocol Offline', 'Unable to fetch real-time guidance. Use standard iCCM protocols.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.patient_id) {
      Alert.alert('Error', 'Patient ID is missing');
      return;
    }

    setLoading(true);
    const result = await visitApiService.create({
      ...formData,
      visit_date: new Date().toISOString()
    });
    setLoading(true);

    if (result.success) {
      Alert.alert('Success', 'Visit recorded successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', result.message || 'Failed to record visit');
    }
  };

  const toggleField = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Visit: {patientName || 'Select Patient'}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Vitals & Symptoms</Text>

        <Text style={styles.label}>Temperature (°C)</Text>
        <TextInput
          style={styles.input}
          value={formData.temperature}
          onChangeText={(text) => setFormData({ ...formData, temperature: text })}
          placeholder="e.g. 37.5"
          keyboardType="numeric"
        />

        <View style={styles.checkboxGroup}>
          {[
            { id: 'cough', label: 'Cough' },
            { id: 'fever', label: 'Fever' },
            { id: 'diarrhea', label: 'Diarrhea' },
            { id: 'rdt_positive', label: 'RDT Positive' },
            { id: 'fast_breathing', label: 'Fast Breathing' },
            { id: 'chest_indrawing', label: 'Chest Indrawing' },
          ].map(item => (
            <TouchableOpacity
              key={item.id}
              style={[styles.checkboxItem, formData[item.id] && styles.checkboxActive]}
              onPress={() => toggleField(item.id)}
            >
              <Text style={[styles.checkboxText, formData[item.id] && styles.checkboxTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.protocolButton}
          onPress={checkProtocol}
          disabled={checking}
        >
          {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.protocolButtonText}>Check iCCM Protocol</Text>}
        </TouchableOpacity>

        {guidance && (
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceTitle}>Clinical Guidance</Text>
            {guidance.danger_signs.length > 0 && (
              <View style={styles.dangerBox}>
                <Icon name="warning" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.dangerText}>DANGER SIGNS DETECTED</Text>
              </View>
            )}
            {guidance.guidances.map((g, slice) => (
              <View key={slice} style={[styles.guidanceItem, g.classification === 'RED' ? styles.borderRed : styles.borderYellow]}>
                <Text style={styles.conditionText}>{g.condition} ({g.classification})</Text>
                <Text style={styles.actionText}>{g.action}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.label}>Clinical Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder="Additional observations..."
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitButtonText}>
            {loading ? 'Saving...' : 'Complete Visit'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  form: { padding: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 15, color: '#666' },
  label: { fontSize: 14, marginBottom: 5, color: '#666' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  textArea: { height: 100, textAlignVertical: 'top' },
  checkboxGroup: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  checkboxItem: { padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', marginRight: 10, marginBottom: 10, backgroundColor: '#fff' },
  checkboxActive: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  checkboxText: { fontSize: 13, color: '#666' },
  checkboxTextActive: { color: '#fff' },
  protocolButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  protocolButtonText: { color: '#fff', fontWeight: 'bold' },
  guidanceBox: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#4CAF50' },
  guidanceTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#2e7d32' },
  guidanceItem: { padding: 10, marginBottom: 10, borderRadius: 4, borderLeftWidth: 4 },
  borderRed: { borderLeftColor: '#f44336', backgroundColor: '#ffebee' },
  borderYellow: { borderLeftColor: '#ffeb3b', backgroundColor: '#fffde7' },
  conditionText: { fontWeight: 'bold', color: '#333' },
  actionText: { fontSize: 14, color: '#555', marginTop: 3 },
  dangerBox: { backgroundColor: '#f44336', padding: 8, borderRadius: 4, marginBottom: 10 },
  dangerText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  submitButton: { backgroundColor: '#2196F3', padding: 18, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default NewVisitScreen;
