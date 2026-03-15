import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl 
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService, dashboardService, syncApiService } from '../services/api';
import { useAppStore } from '../store';
import type { RootStackParamList, DashboardStats, User } from '../types';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
  route?: {
    params?: {
      role?: string;
    };
  };
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Icon.glyphMap;
  color: string;
  onPress: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation, route }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    today_visits: 0,
    pending_tasks: 0,
    total_patients: 0,
    pending_referrals: 0
  });
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  
  const setOffline = useAppStore((state) => state.setOffline);
  const setLastSyncStore = useAppStore((state) => state.setLastSync);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    const userData = await authService.getStoredUser();
    setUser(userData);

    const result = await dashboardService.getStats();
    if (result.success && result.data) {
      setStats(result.data);
      setOffline(result.data.offline || false);
    }

    const syncStatus = await syncApiService.getStatus();
    if (syncStatus.success && syncStatus.data.last_sync) {
      setLastSync(syncStatus.data.last_sync.timestamp);
      setLastSyncStore(syncStatus.data.last_sync.timestamp);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={24} color="#fff" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>
            {user?.first_name 
              ? `${user.first_name} ${user.last_name || ''}` 
              : (user?.role === 'admin' ? 'Administrator' : 'CHW')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Icon name="account-circle" size={48} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.syncStatus}>
        <Icon
          name={stats.offline ? "cloud-off" : "sync"}
          size={16}
          color={stats.offline ? '#F44336' : (lastSync ? '#4CAF50' : '#FF9800')}
        />
        <Text style={styles.syncText}>
          {stats.offline 
            ? 'Operating Offline' 
            : (lastSync ? `Last sync: ${new Date(lastSync).toLocaleString()}` : 'Not synced')}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        {user?.role === 'admin' ? (
          <>
            <StatCard
              title="Global Patients"
              value={stats.total_patients}
              icon="public"
              color="#2196F3"
              onPress={() => navigation.navigate('Patients')}
            />
            <StatCard
              title="System Alerts"
              value="0"
              icon="warning"
              color="#F44336"
              onPress={() => {}}
            />
            <StatCard
              title="CHWs Active"
              value="4"
              icon="engineering"
              color="#4CAF50"
              onPress={() => navigation.navigate('UserManagement')}
            />
            <StatCard
              title="Scaling Status"
              value="Normal"
              icon="speed"
              color="#9C27B0"
              onPress={() => navigation.navigate('ScalingConfig')}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Today's Visits"
              value={stats.today_visits}
              icon="event-available"
              color="#4CAF50"
              onPress={() => navigation.navigate('Tasks')}
            />
            <StatCard
              title="Pending Tasks"
              value={stats.pending_tasks}
              icon="assignment"
              color="#FF9800"
              onPress={() => navigation.navigate('Tasks')}
            />
            <StatCard
              title="Total Patients"
              value={stats.total_patients}
              icon="people"
              color="#2196F3"
              onPress={() => navigation.navigate('Patients')}
            />
            <StatCard
              title="Referrals"
              value={stats.pending_referrals}
              icon="local-hospital"
              color="#F44336"
              onPress={() => navigation.navigate('Referrals')}
            />
          </>
        )}
      </View>

      <View style={styles.quickActions}>
        {user?.role === 'admin' ? (
          <>
            <Text style={styles.sectionTitle}>Admin Management</Text>
            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => navigation.navigate('UserManagement')}
            >
              <Icon name="person-add" size={24} color="#2196F3" />
              <Text style={styles.actionText}>Approve New Users</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => navigation.navigate('SystemPerformance')}
            >
              <Icon name="analytics" size={24} color="#4CAF50" />
              <Text style={styles.actionText}>System Performance</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => navigation.navigate('ScalingConfig')}
            >
              <Icon name="settings-suggest" size={24} color="#FF9800" />
              <Text style={styles.actionText}>Scaling Configuration</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => navigation.navigate('AddPatient')}
            >
              <Icon name="person-add" size={24} color="#2196F3" />
              <Text style={styles.actionText}>Register Patient</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => navigation.navigate('NewVisit')}
            >
              <Icon name="add-circle" size={24} color="#4CAF50" />
              <Text style={styles.actionText}>New Visit</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => navigation.navigate('Households')}
            >
              <Icon name="home" size={24} color="#9C27B0" />
              <Text style={styles.actionText}>Register Household</Text>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  greeting: { 
    color: '#fff', 
    fontSize: 14, 
    opacity: 0.9 
  },
  userName: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    marginHorizontal: 15,
    marginTop: -10,
    borderRadius: 8,
    elevation: 2
  },
  syncText: { 
    marginLeft: 8, 
    color: '#666', 
    fontSize: 12 
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between'
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  statValue: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  statTitle: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 5 
  },
  quickActions: { 
    padding: 15 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    color: '#333' 
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10
  },
  actionText: { 
    flex: 1, 
    marginLeft: 15, 
    fontSize: 16, 
    color: '#333' 
  }
});

export default DashboardScreen;
