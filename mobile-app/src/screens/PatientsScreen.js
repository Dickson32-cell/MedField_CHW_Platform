import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, RefreshControl } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { patientApiService, authService } from '../services/api';

const PatientsScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async (search = '') => {
    const userData = await authService.getStoredUser();
    if (userData?.role === 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await patientApiService.getAll({ search, limit: 50 });
    setLoading(false);

    if (result.success) {
      setPatients(result.data.patients);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients(searchQuery);
    setRefreshing(false);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    loadPatients(text);
  };

  const renderPatient = ({ item }) => (
    <TouchableOpacity
      style={styles.patientItem}
      onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}
    >
      <View style={styles.patientAvatar}>
        <Text style={styles.patientInitial}>
          {item.first_name?.charAt(0)}{item.last_name?.charAt(0)}
        </Text>
      </View>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.first_name} {item.last_name}</Text>
        <Text style={styles.patientId}>ID: {item.patient_id}</Text>
        <View style={styles.badges}>
          {item.is_pregnant && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Pregnant</Text>
            </View>
          )}
          {item.risk_score >= 5 && (
            <View style={[styles.badge, styles.riskBadge]}>
              <Text style={styles.badgeText}>High Risk</Text>
            </View>
          )}
        </View>
      </View>
      <Icon name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Icon name="close" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        renderItem={renderPatient}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddPatient')}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 10,
    padding: 10,
    borderRadius: 8
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center'
  },
  patientInitial: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  patientInfo: { flex: 1, marginLeft: 15 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  patientId: { fontSize: 12, color: '#888', marginTop: 2 },
  badges: { flexDirection: 'row', marginTop: 5 },
  badge: { backgroundColor: '#E91E63', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 5 },
  riskBadge: { backgroundColor: '#F44336' },
  badgeText: { color: '#fff', fontSize: 10 },
  emptyContainer: { alignItems: 'center', paddingTop: 50 },
  emptyText: { color: '#888', marginTop: 10 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5
  },
  restrictedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  restrictedTitle: { fontSize: 24, fontWeight: 'bold', color: '#F44336', marginVertical: 15 },
  restrictedText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 10 },
});

export default PatientsScreen;
