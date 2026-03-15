import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { authService } from '../services/api';
import { useAppStore } from '../store';
import type { User } from '../types';

const ProfileScreen: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const logout = useAppStore((state) => state.logout);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async (): Promise<void> => {
    const userData = await authService.getStoredUser();
    setUser(userData);
  };

  const handleLogout = async (): Promise<void> => {
    await authService.logout();
    logout();
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
          </Text>
        </View>
        <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
        <Text style={styles.role}>{user.role?.toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoRow}>
          <Icon name="person" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user.username}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Icon name="email" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Icon name="phone" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={24} color="#F44336" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
    padding: 30,
    alignItems: 'center'
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  role: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 5
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  infoContent: {
    marginLeft: 15,
    flex: 1
  },
  infoLabel: {
    fontSize: 12,
    color: '#888'
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    marginTop: 2
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    elevation: 2
  },
  logoutText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10
  }
});

export default ProfileScreen;
