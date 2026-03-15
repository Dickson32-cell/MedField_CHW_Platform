import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const AboutScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Icon name="local-hospital" size={64} color="#2196F3" />
        </View>
        <Text style={styles.title}>MedField</Text>
        <Text style={styles.version}>Version 2.0.0</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.text}>
          MedField is a comprehensive Community Health Worker (CHW) platform designed 
          to support healthcare delivery in underserved communities. Our offline-first 
          mobile application enables CHWs to provide quality care even in areas with 
          limited connectivity.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        
        <View style={styles.feature}>
          <Icon name="sync" size={24} color="#4CAF50" />
          <Text style={styles.featureText}>Offline-first data synchronization</Text>
        </View>
        
        <View style={styles.feature}>
          <Icon name="people" size={24} color="#2196F3" />
          <Text style={styles.featureText}>Patient management and registration</Text>
        </View>
        
        <View style={styles.feature}>
          <Icon name="assignment" size={24} color="#FF9800" />
          <Text style={styles.featureText}>Visit tracking and task management</Text>
        </View>
        
        <View style={styles.feature}>
          <Icon name="local-hospital" size={24} color="#F44336" />
          <Text style={styles.featureText}>Referral management system</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>License</Text>
        <Text style={styles.text}>
          This application is licensed under GPL-3.0. For more information, 
          please visit www.medfield.org.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>&#169; 2024 MedField. All rights reserved.</Text>
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
    backgroundColor: '#fff',
    padding: 40,
    alignItems: 'center',
    elevation: 2
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 8,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 15,
    flex: 1
  },
  footer: {
    padding: 20,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 12,
    color: '#888'
  }
});

export default AboutScreen;
