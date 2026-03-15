import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const settingsOptions = [
    { 
      icon: 'person', 
      title: 'Profile', 
      subtitle: 'View and edit your profile',
      onPress: () => navigation.navigate('Profile')
    },
    { 
      icon: 'info', 
      title: 'About', 
      subtitle: 'About MedField app',
      onPress: () => navigation.navigate('About')
    },
    { 
      icon: 'help', 
      title: 'Help & Support', 
      subtitle: 'Get help with the app',
      onPress: () => {}
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        
        {settingsOptions.map((option, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.option}
            onPress={option.onPress}
          >
            <View style={styles.optionIcon}>
              <Icon name={option.icon as keyof typeof Icon.glyphMap} size={24} color="#2196F3" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>2.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Build</Text>
          <Text style={styles.infoValue}>2024.1</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 8,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    padding: 15,
    paddingBottom: 10,
    textTransform: 'uppercase'
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center'
  },
  optionContent: {
    flex: 1,
    marginLeft: 15
  },
  optionTitle: {
    fontSize: 16,
    color: '#333'
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  infoLabel: {
    fontSize: 16,
    color: '#333'
  },
  infoValue: {
    fontSize: 16,
    color: '#666'
  }
});

export default SettingsScreen;
