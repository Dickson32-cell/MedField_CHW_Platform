import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { patientApiService, householdApiService } from '../services/api';
import type { RootStackParamList, PatientFormData, Household } from '../types';

type AddPatientScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddPatient'>;

interface AddPatientScreenProps {
  navigation: AddPatientScreenNavigationProp;
}

interface FormInputs {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  household_id: string;
  is_pregnant: boolean;
  due_date: string;
  risk_factors: string[];
  chronic_conditions: string[];
  allergies: string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

const riskFactorOptions = [
  'Under 5 years',
  'Elderly (65+)',
  'HIV Positive',
  'Diabetes',
  'Hypertension',
  'Malnutrition',
  'Disability',
  'Single Parent'
];

const AddPatientScreen: React.FC<AddPatientScreenProps> = ({ navigation }) => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormInputs>({
    defaultValues: {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'male',
      phone: '',
      household_id: '',
      is_pregnant: false,
      due_date: '',
      risk_factors: [],
      chronic_conditions: [],
      allergies: [],
      emergency_contact_name: '',
      emergency_contact_phone: ''
    }
  });

  const isPregnant = watch('is_pregnant');
  const selectedRiskFactors = watch('risk_factors') || [];

  useEffect(() => {
    loadHouseholds();
  }, []);

  const loadHouseholds = async (): Promise<void> => {
    const result = await householdApiService.getAll({ limit: 100 });
    if (result.success && result.data) {
      setHouseholds(result.data.households || []);
    }
  };

  const toggleRiskFactor = (factor: string): void => {
    const current = selectedRiskFactors;
    if (current.includes(factor)) {
      setValue('risk_factors', current.filter(f => f !== factor));
    } else {
      setValue('risk_factors', [...current, factor]);
    }
  };

  const onSubmit = async (data: FormInputs): Promise<void> => {
    setLoading(true);
    
    const patientData: PatientFormData = {
      ...data,
      emergency_contact: data.emergency_contact_name || data.emergency_contact_phone ? {
        name: data.emergency_contact_name,
        phone: data.emergency_contact_phone
      } : undefined
    };

    const result = await patientApiService.create(patientData);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Patient registered successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', result.message || 'Failed to register patient');
    }
  };

  const renderInput = (
    name: keyof FormInputs,
    label: string,
    placeholder: string,
    required: boolean = false,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
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
            style={[styles.input, errors[name] && styles.inputError]}
            placeholder={placeholder}
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType={options?.keyboardType || 'default'}
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
        <Text style={styles.sectionTitle}>Personal Information</Text>

        {renderInput('first_name', 'First Name', 'Enter first name', true)}
        {renderInput('last_name', 'Last Name', 'Enter last name')}
        {renderInput('date_of_birth', 'Date of Birth', 'YYYY-MM-DD', true)}

        <Text style={styles.label}>Gender *</Text>
        <Controller
          control={control}
          name="gender"
          rules={{ required: 'Gender is required' }}
          render={({ field: { value } }) => (
            <View style={styles.radioGroup}>
              {(['male', 'female', 'other'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.radioButton, 
                    value === g && styles.radioSelected
                  ]}
                  onPress={() => setValue('gender', g)}
                >
                  <Text style={[
                    styles.radioText, 
                    value === g && styles.radioTextSelected
                  ]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />

        {renderInput('phone', 'Phone', 'Phone number', false, { keyboardType: 'phone-pad' })}
        {renderInput('household_id', 'Household', 'Household ID', true)}

        <Text style={styles.sectionTitle}>Health Information</Text>

        <Controller
          control={control}
          name="is_pregnant"
          render={({ field: { value } }) => (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setValue('is_pregnant', !value)}
            >
              <View style={[
                styles.checkbox, 
                value && styles.checkboxChecked
              ]}>
                {value && <Icon name="check" size={18} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Pregnant</Text>
            </TouchableOpacity>
          )}
        />

        {isPregnant && renderInput('due_date', 'Due Date', 'YYYY-MM-DD')}

        <Text style={styles.label}>Risk Factors</Text>
        <View style={styles.checkboxGroup}>
          {riskFactorOptions.map((factor) => (
            <TouchableOpacity
              key={factor}
              style={[
                styles.checkboxItem,
                selectedRiskFactors.includes(factor) && styles.checkboxItemSelected
              ]}
              onPress={() => toggleRiskFactor(factor)}
            >
              <Text style={[
                styles.checkboxItemText,
                selectedRiskFactors.includes(factor) && styles.checkboxItemTextSelected
              ]}>
                {factor}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Emergency Contact</Text>
        {renderInput('emergency_contact_name', 'Contact Name', 'Emergency contact name')}
        {renderInput('emergency_contact_phone', 'Contact Phone', 'Emergency contact phone', false, { keyboardType: 'phone-pad' })}

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Registering...' : 'Register Patient'}
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
  inputError: {
    borderColor: '#F44336'
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginBottom: 10
  },
  radioGroup: { 
    flexDirection: 'row', 
    marginBottom: 15 
  },
  radioButton: { 
    flex: 1, 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    alignItems: 'center', 
    marginRight: 5 
  },
  radioSelected: { 
    backgroundColor: '#2196F3', 
    borderColor: '#2196F3' 
  },
  radioText: { 
    color: '#333' 
  },
  radioTextSelected: { 
    color: '#fff' 
  },
  checkboxContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  checkbox: { 
    width: 24, 
    height: 24, 
    borderRadius: 4, 
    borderWidth: 2, 
    borderColor: '#2196F3', 
    marginRight: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  checkboxChecked: { 
    backgroundColor: '#2196F3' 
  },
  checkboxLabel: { 
    fontSize: 16 
  },
  checkboxGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15
  },
  checkboxItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff'
  },
  checkboxItemSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3'
  },
  checkboxItemText: {
    fontSize: 13,
    color: '#666'
  },
  checkboxItemTextSelected: {
    color: '#fff'
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

export default AddPatientScreen;
