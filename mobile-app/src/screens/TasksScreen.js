import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { taskApiService, authService } from '../services/api';

const TasksScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const userData = await authService.getStoredUser();
    setUserRole(userData?.role);
    if (userData?.role === 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await taskApiService.getAll({ limit: 50 });
    setLoading(false);

    if (result.success) {
      setTasks(result.data.tasks);
    }
  };

  if (userRole === 'admin') {
    return (
      <View style={styles.restrictedContainer}>
        <Icon name="lock" size={64} color="#F44336" />
        <Text style={styles.restrictedTitle}>Access Restricted</Text>
        <Text style={styles.restrictedText}>Administrators are restricted from viewing individual staff tasks and clinical activities to ensure clinical governance and privacy.</Text>
        <Text style={styles.restrictedText}>Please use the Dashboard to view system-wide performance metrics.</Text>
      </View>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      default: return '#4CAF50';
    }
  };

  const renderTask = ({ item }) => (
    <TouchableOpacity style={styles.taskItem}>
      <View style={[styles.priorityBar, { backgroundColor: getPriorityColor(item.priority) }]} />
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        {item.patient && (
          <Text style={styles.taskPatient}>Patient: {item.patient.first_name} {item.patient.last_name}</Text>
        )}
        <View style={styles.taskMeta}>
          <Icon name="event" size={14} color="#888" />
          <Text style={styles.taskDate}>{new Date(item.due_date).toLocaleDateString()}</Text>
          <View style={[styles.statusBadge, item.status === 'completed' && styles.completedBadge]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.checkButton} onPress={() => completeTask(item.id)}>
        <Icon name="check-circle" size={28} color="#4CAF50" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const completeTask = async (id) => {
    const result = await taskApiService.update(id, { status: 'completed' });
    if (result.success) {
      loadTasks();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {['all', 'pending', 'completed'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={tasks.filter(t => filter === 'all' || t.status === filter)}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="assignment" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  filterContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff' },
  filterButton: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, marginHorizontal: 5 },
  filterActive: { backgroundColor: '#2196F3' },
  filterText: { color: '#666' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  taskItem: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 10, marginBottom: 10, borderRadius: 8, overflow: 'hidden' },
  priorityBar: { width: 4 },
  taskContent: { flex: 1, padding: 15 },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  taskPatient: { fontSize: 14, color: '#666', marginTop: 4 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  taskDate: { marginLeft: 4, color: '#888', marginRight: 10 },
  statusBadge: { backgroundColor: '#FF9800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  completedBadge: { backgroundColor: '#4CAF50' },
  statusText: { color: '#fff', fontSize: 10 },
  checkButton: { justifyContent: 'center', padding: 15 },
  emptyContainer: { alignItems: 'center', paddingTop: 50 },
  emptyText: { color: '#888', marginTop: 10 },
  restrictedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  restrictedTitle: { fontSize: 24, fontWeight: 'bold', color: '#F44336', marginVertical: 15 },
  restrictedText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 10 },
});

export default TasksScreen;
