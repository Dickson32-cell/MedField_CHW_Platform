import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const ScalingConfigScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scaling Configuration</Text>
        
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Auto-scaling</Text>
          <View style={styles.toggle}>
            <View style={styles.toggleActive} />
          </View>
        </View>
        
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Max Instances</Text>
          <Text style={styles.configValue}>10</Text>
        </View>
        
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>Min Instances</Text>
          <Text style={styles.configValue}>2</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="refresh" size={24} color="#2196F3" />
          <Text style={styles.actionText}>Trigger Manual Scale</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="assessment" size={24} color="#4CAF50" />
          <Text style={styles.actionText}>View Scaling Metrics</Text>
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
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  configLabel: {
    fontSize: 16,
    color: '#333'
  },
  configValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    padding: 2
  },
  toggleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignSelf: 'flex-end'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15
  }
});

export default ScalingConfigScreen;
