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
import { householdApiService } from '../services/api';
import type { RootStackParamList, Household } from '../types';

type HouseholdsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Households'>;

interface HouseholdsScreenProps {
  navigation: HouseholdsScreenNavigationProp;
}

const HouseholdsScreen: React.FC<HouseholdsScreenProps> = ({ navigation }) => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadHouseholds();
  }, []);

  const loadHouseholds = async (): Promise<void> => {
    const result = await householdApiService.getAll({ limit: 50 });
    if (result.success && result.data) {
      setHouseholds(result.data.households || []);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadHouseholds();
    setRefreshing(false);
  };

  const renderHousehold = ({ item }: { item: Household }) => (
    <TouchableOpacity style={styles.householdItem}>
      <View style={styles.householdIcon}>
        <Icon name="home" size={32} color="#2196F3" />
      </View>
      <View style={styles.householdInfo}>
        <Text style={styles.householdId}>ID: {item.household_id}</Text>
        <Text style={styles.headName}>Head: {item.head_of_household}</Text>
        <Text style={styles.address}>{item.address}</Text>
        <Text style={styles.members}>{item.members_count} members</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={households}
        keyExtractor={(item) => item.id}
        renderItem={renderHousehold}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="home" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No households found</Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddHousehold')}
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
  householdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2
  },
  householdIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center'
  },
  householdInfo: {
    flex: 1,
    marginLeft: 15
  },
  householdId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  headName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  address: {
    fontSize: 12,
    color: '#888',
    marginTop: 2
  },
  members: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 4
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

export default HouseholdsScreen;
