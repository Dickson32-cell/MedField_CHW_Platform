import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl 
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { referralApiService } from '../services/api';
import type { RootStackParamList, Referral } from '../types';

type ReferralsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Referrals'>;

interface ReferralsScreenProps {
  navigation: ReferralsScreenNavigationProp;
}

const ReferralsScreen: React.FC<ReferralsScreenProps> = ({ navigation }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async (): Promise<void> => {
    const result = await referralApiService.getAll({ limit: 50 });
    if (result.success && result.data) {
      setReferrals(result.data.referrals || []);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadReferrals();
    setRefreshing(false);
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'emergency': return '#F44336';
      case 'urgent': return '#FF9800';
      default: return '#2196F3';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'accepted': return '#2196F3';
      case 'rejected': return '#F44336';
      default: return '#FF9800';
    }
  };

  const renderReferral = ({ item }: { item: Referral }) => (
    <TouchableOpacity style={styles.referralItem}>
      <View style={styles.referralHeader}>
        <Text style={styles.referralType}>{item.referral_type}</Text>
        <View style={[
          styles.priorityBadge, 
          { backgroundColor: getPriorityColor(item.priority) }
        ]}>
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
      </View>
      
      {item.patient && (
        <Text style={styles.patientName}>
          Patient: {item.patient.first_name} {item.patient.last_name}
        </Text>
      )}
      
      <Text style={styles.reason}>Reason: {item.reason}</Text>
      
      <View style={[
        styles.statusBadge, 
        { backgroundColor: getStatusColor(item.status) }
      ]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={referrals}
        keyExtractor={(item) => item.id}
        renderItem={renderReferral}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="local-hospital" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No referrals found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  listContent: {
    padding: 15
  },
  referralItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  referralType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize'
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  patientName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  reason: {
    fontSize: 13,
    color: '#888',
    marginBottom: 10
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100
  },
  emptyText: {
    color: '#888',
    marginTop: 10,
    fontSize: 16
  }
});

export default ReferralsScreen;
