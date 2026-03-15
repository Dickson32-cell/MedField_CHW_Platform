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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { visitApiService } from '../services/api';
import type { RootStackParamList, Visit } from '../types';

type VisitsScreenProps = NativeStackScreenProps<RootStackParamList, 'Visits'>;

const VisitsScreen: React.FC<VisitsScreenProps> = ({ navigation, route }) => {
  const { patientId } = route.params || {};
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadVisits();
  }, [patientId]);

  const loadVisits = async (): Promise<void> => {
    setLoading(true);
    const result = await visitApiService.getAll({ patient_id: patientId, limit: 50 });
    if (result.success && result.data) {
      setVisits(result.data.visits || []);
    }
    setLoading(false);
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadVisits();
    setRefreshing(false);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#FF9800';
    }
  };

  const renderVisit = ({ item }: { item: Visit }) => (
    <TouchableOpacity style={styles.visitItem}>
      <View style={styles.visitHeader}>
        <Text style={styles.visitNumber}>Visit #{item.visit_number}</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(item.visit_status) }
        ]}>
          <Text style={styles.statusText}>{item.visit_status}</Text>
        </View>
      </View>
      
      <Text style={styles.visitDate}>
        {new Date(item.visit_date).toLocaleDateString()}
      </Text>
      
      <Text style={styles.visitType}>Type: {item.visit_type}</Text>
      
      {item.notes && (
        <Text style={styles.visitNotes} numberOfLines={2}>{item.notes}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={visits}
        keyExtractor={(item) => item.id}
        renderItem={renderVisit}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="event-busy" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No visits found</Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewVisit', { patientId })}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
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
  visitItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  visitNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: {
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
  visitDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  visitType: {
    fontSize: 14,
    color: '#2196F3',
    textTransform: 'capitalize',
    marginBottom: 5
  },
  visitNotes: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100
  },
  emptyText: {
    color: '#888',
    marginTop: 10,
    fontSize: 16
  },
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
  }
});

export default VisitsScreen;
