import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { householdApiService } from '../services/api';
import type { RootStackParamList } from '../types';

type AddHouseholdScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddHousehold'>;

interface AddHouseholdScreenProps {
  navigation: AddHouseholdScreenNavigationProp;
}

interface FormInputs {
  household_id: string;
  head_of_household: string;
  address: string;
  phone: string;
  members_count: string;
}

const AddHouseholdScreen: React.FC<AddHouseholdScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState<boolean>(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<FormInputs>({
    defaultValues: {
      household_id: '',
      head_of_household: '',
      address: '',
      phone: '',
      members_count: ''
    }
  });

  const onSubmit = async (data: FormInputs): Promise<void> => {
    setLoading(true);
    
    const householdData = {
      ...data,
      members_count: parseInt(data.members_count, 10) || 0
    };

    const result = await householdApiService.create(householdData);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Household registered successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', result.message || 'Failed to register household');
    }
  };

  const renderInput = (
    name: keyof FormInputs,
    label: string,
    placeholder: string,
    required: boolean = false,
    options?: {
      keyboardType?: 'default' | 'phone-pad' | 'numeric';
      multiline?: boolean;
    }
  ) => (
    <>
      <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
      <Controller
        control={control}
        name={name}
        rules={{ required: required ? `${label} is required` : false }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input, 
              options?.multiline && styles.textArea,
              errors[name] && styles.inputError
            ]}
            placeholder={placeholder}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType={options?.keyboardType || 'default'}
            multiline={options?.multiline}
            numberOfLines={options?.multiline ? 3 : 1}
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
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Household Information</Text>

        {renderInput('household_id', 'Household ID', 'Enter household ID', true)}
        {renderInput('head_of_household', 'Head of Household', 'Enter name', true)}
        {renderInput('address', 'Address', 'Enter full address', true, { multiline: true })}
        {renderInput('phone', 'Phone Number', 'Enter phone number', false, { keyboardType: 'phone-pad' })}
        {renderInput('members_count', 'Number of Members', 'Enter count', true, { keyboardType: 'numeric' })}

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Registering...' : 'Register Household'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  form: { 
    padding: 15 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 20, 
    marginBottom: 15, 
    color: '#333' 
  },
  label: { 
    fontSize: 14, 
    marginBottom: 5, 
    color: '#666' 
  },
  required: {
    color: '#F44336'
  },
  input: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 5, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  inputError: {
    borderColor: '#F44336'
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginBottom: 10
  },
  submitButton: { 
    backgroundColor: '#2196F3', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 20, 
    marginBottom: 40 
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  submitButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});

export default AddHouseholdScreen;
