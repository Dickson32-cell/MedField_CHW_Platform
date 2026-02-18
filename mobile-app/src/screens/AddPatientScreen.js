import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { patientApiService, householdApiService } from '../services/api';

const AddPatientScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'male',
    phone: '',
    household_id: '',
    is_pregnant: false,
    due_date: '',
    risk_factors: [],
    chronic_conditions: [],
    allergies: [],
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(false);

  const riskFactorOptions = [
    'Under 5 years',
    'Elderly (65+)',
    'HIV Positive',
    'Diabetes',
    'Hypertension',
    'Malnutrition',
    'Disability',
    'Single Parent'
  ];

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.date_of_birth || !formData.gender || !formData.household_id) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setLoading(true);
    const data = {
      ...formData,
      emergency_contact: {
        name: formData.emergency_contact_name,
        phone: formData.emergency_contact_phone
      }
    };

    const result = await patientApiService.create(data);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Patient registered successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', result.message || 'Failed to register patient');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={formData.first_name}
          onChangeText={(text) => setFormData({ ...formData, first_name: text })}
          placeholder="Enter first name"
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={formData.last_name}
          onChangeText={(text) => setFormData({ ...formData, last_name: text })}
          placeholder="Enter last name"
        />

        <Text style={styles.label}>Date of Birth *</Text>
        <TextInput
          style={styles.input}
          value={formData.date_of_birth}
          onChangeText={(text) => setFormData({ ...formData, date_of_birth: text })}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.label}>Gender *</Text>
        <View style={styles.radioGroup}>
          {['male', 'female', 'other'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.radioButton, formData.gender === g && styles.radioSelected]}
              onPress={() => setFormData({ ...formData, gender: g })}
            >
              <Text style={[styles.radioText, formData.gender === g && styles.radioTextSelected]}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Household *</Text>
        <TextInput
          style={styles.input}
          value={formData.household_id}
          onChangeText={(text) => setFormData({ ...formData, household_id: text })}
          placeholder="Household ID"
        />

        <Text style={styles.sectionTitle}>Health Information</Text>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setFormData({ ...formData, is_pregnant: !formData.is_pregnant })}
        >
          <View style={[styles.checkbox, formData.is_pregnant && styles.checkboxChecked]}>
            {formData.is_pregnant && <Icon name="check" size={18} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>Pregnant</Text>
        </TouchableOpacity>

        {formData.is_pregnant && (
          <>
            <Text style={styles.label}>Due Date</Text>
            <TextInput
              style={styles.input}
              value={formData.due_date}
              onChangeText={(text) => setFormData({ ...formData, due_date: text })}
              placeholder="YYYY-MM-DD"
            />
          </>
        )}

        <Text style={styles.sectionTitle}>Emergency Contact</Text>

        <Text style={styles.label}>Contact Name</Text>
        <TextInput
          style={styles.input}
          value={formData.emergency_contact_name}
          onChangeText={(text) => setFormData({ ...formData, emergency_contact_name: text })}
          placeholder="Emergency contact name"
        />

        <Text style={styles.label}>Contact Phone</Text>
        <TextInput
          style={styles.input}
          value={formData.emergency_contact_phone}
          onChangeText={(text) => setFormData({ ...formData, emergency_contact_phone: text })}
          placeholder="Emergency contact phone"
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitButtonText}>
            {loading ? 'Registering...' : 'Register Patient'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  form: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 15, color: '#333' },
  label: { fontSize: 14, marginBottom: 5, color: '#666' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  radioGroup: { flexDirection: 'row', marginBottom: 15 },
  radioButton: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', marginRight: 5 },
  radioSelected: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  radioText: { color: '#333' },
  radioTextSelected: { color: '#fff' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#2196F3', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#2196F3' },
  checkmark: { color: '#fff', fontWeight: 'bold' },
  checkboxLabel: { fontSize: 16 },
  submitButton: { backgroundColor: '#2196F3', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default AddPatientScreen;
