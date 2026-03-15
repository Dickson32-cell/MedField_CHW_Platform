import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService } from '../services/api';
import type { RootStackParamList, RegisterFormData } from '../types';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

interface RegisterFormInputs {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState<boolean>(false);
  
  const { control, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormInputs>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: ''
    }
  });

  const onSubmit = async (data: RegisterFormInputs): Promise<void> => {
    setLoading(true);
    const formData: RegisterFormData = {
      ...data,
      role: 'chw'
    };
    
    const result = await authService.register(formData);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Registration Sent',
        'Your account request has been sent to the Administrator for approval. You will be able to log in once approved.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert('Registration Failed', result.message || 'Error creating account');
    }
  };

  const renderInput = (
    name: keyof RegisterFormInputs,
    label: string,
    placeholder: string,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      secureTextEntry?: boolean;
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      rules?: Record<string, unknown>;
    }
  ) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        rules={{
          required: `${label} is required`,
          ...options?.rules
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, errors[name] && styles.inputError]}
            placeholder={placeholder}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType={options?.keyboardType || 'default'}
            secureTextEntry={options?.secureTextEntry}
            autoCapitalize={options?.autoCapitalize || 'sentences'}
            editable={!loading}
          />
        )}
      />
      {errors[name] && (
        <Text style={styles.errorText}>{errors[name]?.message}</Text>
      )}
    </>
  );

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>MedField CHW Registration</Text>
      </View>

      <View style={styles.form}>
        {renderInput('first_name', 'First Name', 'e.g. John')}
        {renderInput('last_name', 'Last Name', 'e.g. Doe')}
        {renderInput('email', 'Email Address', 'email@example.com', {
          keyboardType: 'email-address',
          autoCapitalize: 'none',
          rules: {
            pattern: {
              value: /^\S+@\S+$/i,
              message: 'Invalid email address'
            }
          }
        })}
        {renderInput('phone', 'Phone Number', '+233...', {
          keyboardType: 'phone-pad'
        })}
        {renderInput('username', 'Username', 'Choose a username', {
          autoCapitalize: 'none'
        })}
        {renderInput('password', 'Password', 'Choose a secure password', {
          secureTextEntry: true,
          rules: {
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters'
            }
          }
        })}

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Request Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.link} 
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#2196F3' 
  },
  content: { 
    padding: 20, 
    paddingTop: 60, 
    paddingBottom: 40 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 30 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  subtitle: { 
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
  label: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 5,
    marginTop: 10
  },
  input: { 
    backgroundColor: '#f5f5f5', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16 
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#F44336'
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 2
  },
  button: { 
    backgroundColor: '#1976D2', 
    borderRadius: 8, 
    padding: 15, 
    alignItems: 'center', 
    marginTop: 20 
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  link: { 
    marginTop: 20, 
    alignItems: 'center' 
  },
  linkText: { 
    color: '#2196F3', 
    fontSize: 14, 
    fontWeight: '500' 
  }
});

export default RegisterScreen;
