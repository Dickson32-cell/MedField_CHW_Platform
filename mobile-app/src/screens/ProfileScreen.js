import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { authService } from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userData = await authService.getStoredUser();
    setUser(userData);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          navigation.replace('Login');
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.first_name?.charAt(0) || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
        <Text style={styles.role}>{user?.role?.toUpperCase() || 'CHW'}</Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Icon name="email" size={20} color="#666" />
          <Text style={styles.infoText}>{user?.email || 'N/A'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="phone" size={20} color="#666" />
          <Text style={styles.infoText}>{user?.phone || 'N/A'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color="#F44336" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#2196F3', alignItems: 'center', padding: 30 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#2196F3' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 15 },
  role: { fontSize: 14, color: '#fff', opacity: 0.9 },
  infoSection: { backgroundColor: '#fff', margin: 15, borderRadius: 10, padding: 15 },
  infoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  infoText: { marginLeft: 15, fontSize: 16, color: '#333' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 15, padding: 15, backgroundColor: '#fff', borderRadius: 10 },
  logoutText: { marginLeft: 10, color: '#F44336', fontSize: 16, fontWeight: 'bold' }
});

export default ProfileScreen;
