import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList, LoginFormData } from '../types';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

interface LoginFormInputs {
  username: string;
  password: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [deviceId, setDeviceId] = useState<string>('');
  
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    defaultValues: {
      username: '',
      password: ''
    }
  });
  
  const { login } = useAuthStore();

  useEffect(() => {
    initializeDevice();
  }, []);

  const initializeDevice = async (): Promise<void> => {
    let id = await AsyncStorage.getItem('device_id');
    if (!id) {
      id = uuidv4();
      await AsyncStorage.setItem('device_id', id);
    }
    setDeviceId(id);
  };

  const onSubmit = async (data: LoginFormInputs): Promise<void> => {
    setLoading(true);
    const result = await authService.login(data.username, data.password, deviceId);
    setLoading(false);

    if (result.success && result.data) {
      const { accessToken, refreshToken, user } = result.data;
      login(user, accessToken, refreshToken);
      navigation.replace('Main', { role: user.role });
    } else {
      Alert.alert('Login Failed', result.message || 'Invalid credentials');
    }
  };

  const handleOfflineLogin = async (): Promise<void> => {
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
        <Controller
          control={control}
          name="username"
          rules={{ required: 'Username is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="Username"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                placeholderTextColor="#888"
                editable={!loading}
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username.message}</Text>
              )}
            </>
          )}
        />

        <View style={styles.passwordContainer}>
          <Controller
            control={control}
            name="password"
            rules={{ required: 'Password is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  style={[styles.passwordInput, errors.password && styles.inputError]}
                  placeholder="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#888"
                  editable={!loading}
                />
              </>
            )}
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
        {errors.password && (
          <Text style={styles.errorText}>{errors.password.message}</Text>
        )}

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSubmit(onSubmit)} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.offlineButton} 
          onPress={handleOfflineLogin}
          disabled={loading}
        >
          <Text style={styles.offlineButtonText}>Continue Offline</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.registerLink} 
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
        >
          <Text style={styles.registerLinkText}>New Staff? Request Account</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>MedField v2.0.0 | Offline-First</Text>
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
    marginBottom: 5,
    fontSize: 16
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#F44336'
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 10,
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
    marginTop: 15
  },
  buttonDisabled: {
    opacity: 0.7
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
