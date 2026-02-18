import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { referralApiService } from '../services/api';

const ReferralsScreen = ({ navigation }) => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    setLoading(true);
    const result = await referralApiService.getAll({ limit: 50 });
    setLoading(false);

    if (result.success) {
      setReferrals(result.data.referrals || []);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReferrals();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'not_completed': return '#F44336';
      case 'cancelled': return '#757575';
      default: return '#2196F3';
    }
  };

  const renderReferral = ({ item }) => (
    <TouchableOpacity
      style={styles.referralCard}
      onPress={() => Alert.alert('Referral Detail', `Reason: ${item.referral_reason}\nFacility: ${item.referred_to_facility}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.referralNumber}>{item.referral_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Icon name="person" size={16} color="#666" />
          <Text style={styles.patientName}>
            {item.Patient ? `${item.Patient.first_name} ${item.Patient.last_name}` : 'Unknown Patient'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="local-hospital" size={16} color="#666" />
          <Text style={styles.facilityName}>{item.referred_to_facility}</Text>
        </View>

        <View style={styles.infoRow}>
          <Icon name="event" size={16} color="#666" />
          <Text style={styles.dateText}>{new Date(item.referral_date).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.reasonContainer}>
        <Text style={styles.reasonTitle}>Reason:</Text>
        <Text style={styles.reasonText} numberOfLines={2}>{item.referral_reason}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <FlatList
          data={referrals}
          keyExtractor={(item) => item.id}
          renderItem={renderReferral}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Icon name="assignment-late" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No referrals found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContainer: { padding: 10 },
  referralCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: '#2196F3'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  referralNumber: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardBody: { marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  patientName: { marginLeft: 10, fontSize: 16, fontWeight: 'bold', color: '#333' },
  facilityName: { marginLeft: 10, fontSize: 14, color: '#666' },
  dateText: { marginLeft: 10, fontSize: 13, color: '#888' },
  reasonContainer: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  reasonTitle: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 2 },
  reasonText: { fontSize: 14, color: '#444' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyText: { marginTop: 15, color: '#999', fontSize: 16 }
});

export default ReferralsScreen;
