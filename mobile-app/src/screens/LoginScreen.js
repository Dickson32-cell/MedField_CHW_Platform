import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    initializeDevice();
  }, []);

  const initializeDevice = async () => {
    let id = await AsyncStorage.getItem('device_id');
    if (!id) {
      id = uuidv4();
      await AsyncStorage.setItem('device_id', id);
    }
    setDeviceId(id);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoading(true);
    const result = await authService.login(username, password, deviceId);
    setLoading(false);

    if (result.success) {
      navigation.replace('Main', { role: result.data.user.role });
    } else {
      Alert.alert('Login Failed', result.message || 'Invalid credentials');
    }
  };

  const handleOfflineLogin = async () => {
    const user = await authService.getStoredUser();
    if (user) {
      navigation.replace('Main', { role: user.role });
    } else {
      Alert.alert('Offline', 'No cached credentials. Please connect to the internet for first login.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>MedField</Text>
        <Text style={styles.tagline}>Community Health Worker Platform</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholderTextColor="#888"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#888"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.offlineButton} onPress={handleOfflineLogin}>
          <Text style={styles.offlineButtonText}>Continue Offline</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLinkText}>New Staff? Request Account</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>MedField v1.1.0 | Offline-First</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    padding: 20
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff'
  },
  tagline: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 5
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  offlineButton: {
    marginTop: 15,
    alignItems: 'center'
  },
  offlineButtonText: {
    color: '#666',
    fontSize: 14
  },
  footer: {
    textAlign: 'center',
    color: '#fff',
    marginTop: 30,
    opacity: 0.8
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15
  },
  registerLinkText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold'
  }
});

export default LoginScreen;
