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
import { taskApiService } from '../services/api';
import type { RootStackParamList, Task } from '../types';

type TasksScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface TasksScreenProps {
  navigation: TasksScreenNavigationProp;
}

const TasksScreen: React.FC<TasksScreenProps> = ({ navigation }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async (): Promise<void> => {
    const result = await taskApiService.getToday();
    if (result.success && result.data) {
      setTasks(result.data.tasks || []);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      default: return '#4CAF50';
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity style={styles.taskItem}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
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
      
      <Text style={styles.dueDate}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
      
      <Text style={styles.taskType}>Type: {item.task_type}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="assignment-turned-in" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tasks for today</Text>
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
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1
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
  dueDate: {
    fontSize: 13,
    color: '#888',
    marginBottom: 3
  },
  taskType: {
    fontSize: 13,
    color: '#2196F3',
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

export default TasksScreen;
