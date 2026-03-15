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
import { userApiService } from '../services/api';
import type { User } from '../types';

const UserManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (): Promise<void> => {
    const result = await userApiService.getAll({ limit: 100 });
    if (result.success && result.data) {
      setUsers(result.data.users || []);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleApprove = async (userId: string): Promise<void> => {
    const result = await userApiService.approve(userId);
    if (result.success) {
      await loadUsers();
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.first_name} {item.last_name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
      </View>
      
      {!item.is_active && (
        <TouchableOpacity 
          style={styles.approveButton}
          onPress={() => handleApprove(item.id)}
        >
          <Text style={styles.approveText}>Approve</Text>
        </TouchableOpacity>
      )}
      
      {item.is_active && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>Active</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No users found</Text>
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
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  userRole: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
    textTransform: 'capitalize'
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4
  },
  approveText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  activeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4
  },
  activeText: {
    color: '#2196F3',
    fontWeight: 'bold'
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

export default UserManagementScreen;
