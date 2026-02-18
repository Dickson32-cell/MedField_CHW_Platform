import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { householdApiService } from '../services/api';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

const AddHouseholdScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    household_number: '',
    head_of_household: '',
    address: '',
    village: '',
    community: '',
    ward: '',
    catchment_area: '',
    gps_coordinates: ''
  });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  };

  const captureLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required to capture coordinates.');
      return;
    }

    setLocating(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      setFormData({ ...formData, gps_coordinates: `${latitude}, ${longitude}` });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to get location. Please ensure GPS is enabled.');
    }
    setLocating(false);
  };

  const handleSubmit = async () => {
    if (!formData.household_number || !formData.head_of_household) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setLoading(true);
    const result = await householdApiService.create(formData);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Household registered successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', result.message || 'Failed to register household');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Household Information</Text>

        <Text style={styles.label}>Household Number *</Text>
        <TextInput
          style={styles.input}
          value={formData.household_number}
          onChangeText={(text) => setFormData({ ...formData, household_number: text })}
          placeholder="e.g. HH-001"
        />

        <Text style={styles.label}>Head of Household *</Text>
        <TextInput
          style={styles.input}
          value={formData.head_of_household}
          onChangeText={(text) => setFormData({ ...formData, head_of_household: text })}
          placeholder="Enter full name"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          placeholder="Physical address description"
          multiline
        />

        <Text style={styles.sectionTitle}>Location Details</Text>

        <Text style={styles.label}>GPS Coordinates</Text>
        <View style={styles.gpsContainer}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={formData.gps_coordinates}
            editable={false}
            placeholder="Lat, Long"
          />
          <TouchableOpacity
            style={styles.gpsButton}
            onPress={captureLocation}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Icon name="my-location" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 5 }}>
            <Text style={styles.label}>Village</Text>
            <TextInput
              style={styles.input}
              value={formData.village}
              onChangeText={(text) => setFormData({ ...formData, village: text })}
              placeholder="Village name"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Text style={styles.label}>Community</Text>
            <TextInput
              style={styles.input}
              value={formData.community}
              onChangeText={(text) => setFormData({ ...formData, community: text })}
              placeholder="Community"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 5 }}>
            <Text style={styles.label}>Ward</Text>
            <TextInput
              style={styles.input}
              value={formData.ward}
              onChangeText={(text) => setFormData({ ...formData, ward: text })}
              placeholder="Ward name"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Text style={styles.label}>Catchment Area</Text>
            <TextInput
              style={styles.input}
              value={formData.catchment_area}
              onChangeText={(text) => setFormData({ ...formData, catchment_area: text })}
              placeholder="Clinic/Facility"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitButtonText}>
            {loading ? 'Processing...' : 'Register Household'}
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
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16, borderWeight: 1, borderColor: '#eee' },
  row: { flexDirection: 'row' },
  gpsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  gpsButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    elevation: 2
  },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default AddHouseholdScreen;
