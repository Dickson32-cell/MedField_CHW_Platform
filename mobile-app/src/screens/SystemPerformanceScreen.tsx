import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const SystemPerformanceScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Status</Text>
        
        <View style={styles.statusItem}>
          <Icon name="check-circle" size={24} color="#4CAF50" />
          <View style={styles.statusContent}>
            <Text style={styles.statusLabel}>API Server</Text>
            <Text style={styles.statusValue}>Operational</Text>
          </View>
        </View>
        
        <View style={styles.statusItem}>
          <Icon name="check-circle" size={24} color="#4CAF50" />
          <View style={styles.statusContent}>
            <Text style={styles.statusLabel}>Database</Text>
            <Text style={styles.statusValue}>Operational</Text>
          </View>
        </View>
        
        <View style={styles.statusItem}>
          <Icon name="check-circle" size={24} color="#4CAF50" />
          <View style={styles.statusContent}>
            <Text style={styles.statusLabel}>Sync Service</Text>
            <Text style={styles.statusValue}>Operational</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Response Time</Text>
          <Text style={styles.metricValue}>45ms</Text>
        </View>
        
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Uptime</Text>
          <Text style={styles.metricValue}>99.9%</Text>
        </View>
        
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Active Users</Text>
          <Text style={styles.metricValue}>24</Text>
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
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  statusContent: {
    marginLeft: 15,
    flex: 1
  },
  statusLabel: {
    fontSize: 16,
    color: '#333'
  },
  statusValue: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  metricLabel: {
    fontSize: 16,
    color: '#333'
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3'
  }
});

export default SystemPerformanceScreen;
