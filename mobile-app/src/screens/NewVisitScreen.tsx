import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { visitApiService, protocolApiService } from '../services/api';
import type { RootStackParamList, VisitFormData, Assessment } from '../types';

type NewVisitScreenProps = NativeStackScreenProps<RootStackParamList, 'NewVisit'>;

interface FormInputs {
  patient_id: string;
  visit_type: string;
  temperature: string;
  cough: boolean;
  diarrhea: boolean;
  fever: boolean;
  rdt_positive: boolean;
  fast_breathing: boolean;
  chest_indrawing: boolean;
  notes: string;
}

const symptomOptions = [
  { id: 'cough', label: 'Cough' },
  { id: 'fever', label: 'Fever' },
  { id: 'diarrhea', label: 'Diarrhea' },
  { id: 'rdt_positive', label: 'RDT Positive' },
  { id: 'fast_breathing', label: 'Fast Breathing' },
  { id: 'chest_indrawing', label: 'Chest Indrawing' },
] as const;

const NewVisitScreen: React.FC<NewVisitScreenProps> = ({ navigation, route }) => {
  const { patientId, patientName } = route.params || {};
  
  const [guidance, setGuidance] = useState<{ danger_signs: string[]; guidances: Assessment[] } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormInputs>({
    defaultValues: {
      patient_id: patientId || '',
      visit_type: 'scheduled',
      temperature: '',
      cough: false,
      diarrhea: false,
      fever: false,
      rdt_positive: false,
      fast_breathing: false,
      chest_indrawing: false,
      notes: ''
    }
  });

  const formValues = watch();

  const checkProtocol = async (): Promise<void> => {
    setChecking(true);
    const result = await protocolApiService.assess({
      ...formValues,
      temperature: parseFloat(formValues.temperature) || 0
    });
    setChecking(false);

    if (result.success && result.data) {
      setGuidance(result.data);
    } else {
      Alert.alert('Protocol Offline', 'Unable to fetch real-time guidance. Use standard iCCM protocols.');
    }
  };

  const onSubmit = async (data: FormInputs): Promise<void> => {
    if (!data.patient_id) {
      Alert.alert('Error', 'Patient ID is missing');
      return;
    }

    setLoading(true);
    const result = await visitApiService.create({
      ...data,
      visit_date: new Date().toISOString()
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Visit recorded successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', result.message || 'Failed to record visit');
    }
  };

  const toggleSymptom = (field: keyof FormInputs): void => {
    const currentValue = formValues[field] as boolean;
    setValue(field as keyof FormInputs, !currentValue);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          New Visit: {patientName || 'Select Patient'}
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Vitals & Symptoms</Text>

        <Text style={styles.label}>Temperature (°C)</Text>
        <Controller
          control={control}
          name="temperature"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="e.g. 37.5"
              keyboardType="numeric"
            />
          )}
        />

        <View style={styles.checkboxGroup}>
          {symptomOptions.map((item) => (
            <Controller
              key={item.id}
              control={control}
              name={item.id as keyof FormInputs}
              render={({ field: { value } }) => (
                <TouchableOpacity
                  style={[
                    styles.checkboxItem, 
                    value && styles.checkboxActive
                  ]}
                  onPress={() => toggleSymptom(item.id as keyof FormInputs)}
                >
                  <Text style={[
                    styles.checkboxText, 
                    value && styles.checkboxTextActive
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.protocolButton}
          onPress={checkProtocol}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.protocolButtonText}>Check iCCM Protocol</Text>
          )}
        </TouchableOpacity>

        {guidance && (
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceTitle}>Clinical Guidance</Text>
            {guidance.danger_signs.length > 0 && (
              <View style={styles.dangerBox}>
                <Icon name="warning" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.dangerText}>DANGER SIGNS DETECTED</Text>
              </View>
            )}
            {guidance.guidances.map((g, index) => (
              <View 
                key={index} 
                style={[
                  styles.guidanceItem, 
                  g.classification === 'RED' ? styles.borderRed : styles.borderYellow
                ]}
              >
                <Text style={styles.conditionText}>{g.condition} ({g.classification})</Text>
                <Text style={styles.actionText}>{g.action}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.label}>Clinical Notes</Text>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Additional observations..."
              multiline
              numberOfLines={4}
            />
          )}
        />

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Saving...' : 'Complete Visit'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  header: { 
    padding: 20, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#2c3e50' 
  },
  form: { 
    padding: 15 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginVertical: 15, 
    color: '#666' 
  },
  label: { 
    fontSize: 14, 
    marginBottom: 5, 
    color: '#666' 
  },
  input: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
  textArea: { 
    height: 100, 
    textAlignVertical: 'top' 
  },
  checkboxGroup: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: 15 
  },
  checkboxItem: { 
    padding: 10, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    marginRight: 10, 
    marginBottom: 10, 
    backgroundColor: '#fff' 
  },
  checkboxActive: { 
    backgroundColor: '#2196F3', 
    borderColor: '#2196F3' 
  },
  checkboxText: { 
    fontSize: 13, 
    color: '#666' 
  },
  checkboxTextActive: { 
    color: '#fff' 
  },
  protocolButton: { 
    backgroundColor: '#4CAF50', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  protocolButtonText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  guidanceBox: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#4CAF50' 
  },
  guidanceTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    color: '#2e7d32' 
  },
  guidanceItem: { 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 4, 
    borderLeftWidth: 4 
  },
  borderRed: { 
    borderLeftColor: '#f44336', 
    backgroundColor: '#ffebee' 
  },
  borderYellow: { 
    borderLeftColor: '#ffeb3b', 
    backgroundColor: '#fffde7' 
  },
  conditionText: { 
    fontWeight: 'bold', 
    color: '#333' 
  },
  actionText: { 
    fontSize: 14, 
    color: '#555', 
    marginTop: 3 
  },
  dangerBox: { 
    backgroundColor: '#f44336', 
    padding: 8, 
    borderRadius: 4, 
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dangerText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  submitButton: { 
    backgroundColor: '#2196F3', 
    padding: 18, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 10, 
    marginBottom: 40 
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  submitButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  }
});

export default NewVisitScreen;
