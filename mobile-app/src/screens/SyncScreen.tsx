import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { syncApiService } from '../services/api';
import { useAppStore } from '../store';

const SyncScreen: React.FC = () => {
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  
  const isOffline = useAppStore((state) => state.isOffline);
  const setLastSyncStore = useAppStore((state) => state.setLastSync);

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async (): Promise<void> => {
    const result = await syncApiService.getStatus();
    if (result.success && result.data.last_sync) {
      setLastSync(result.data.last_sync.timestamp);
    }
  };

  const handleSync = async (): Promise<void> => {
    setSyncing(true);
    
    // Push local data
    await syncApiService.pushData();
    
    // Pull remote data
    await syncApiService.pullData();
    
    // Refresh status
    await loadSyncStatus();
    
    setSyncing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <Icon 
          name={isOffline ? "cloud-off" : "cloud-done"} 
          size={64} 
          color={isOffline ? '#F44336' : '#4CAF50'} 
        />
        <Text style={styles.statusTitle}>
          {isOffline ? 'Operating Offline' : 'Connected'}
        </Text>
        <Text style={styles.statusText}>
          {lastSync 
            ? `Last synced: ${new Date(lastSync).toLocaleString()}` 
            : 'Never synced'}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.syncButton, (syncing || isOffline) && styles.syncButtonDisabled]}
        onPress={handleSync}
        disabled={syncing || isOffline}
      >
        {syncing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="sync" size={24} color="#fff" />
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </>
        )}
      </TouchableOpacity>

      {isOffline && (
        <View style={styles.offlineMessage}>
          <Icon name="info" size={20} color="#FF9800" />
          <Text style={styles.offlineText}>
            You are offline. Data will sync automatically when connection is restored.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    elevation: 3,
    marginBottom: 20
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#333'
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8
  },
  syncButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    elevation: 2
  },
  syncButtonDisabled: {
    opacity: 0.6
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10
  },
  offlineMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 20
  },
  offlineText: {
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
    fontSize: 14
  }
});

export default SyncScreen;
