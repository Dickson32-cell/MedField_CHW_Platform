import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, RefreshControl, Alert } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { syncApiService, authService } from '../services/api';

const SyncScreen = ({ navigation }) => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  useEffect(() => {
    checkSyncStatus();
  }, []);

  const checkSyncStatus = async () => {
    const result = await syncApiService.getStatus();
    if (result.success) {
      setSyncStatus(result.data);
      if (result.data.last_sync) {
        setLastSync(result.data.last_sync.timestamp);
      }
    }

    // Check locally for unsynced records
    const queue = await syncApiService.getSyncQueue();
    const count = (queue.patients?.length || 0) +
      (queue.visits?.length || 0) +
      (queue.tasks?.length || 0) +
      (queue.referrals?.length || 0) +
      (queue.households?.length || 0);
    setUnsyncedCount(count);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      // Pull first to get latest updates from other CHWs
      const pullResult = await syncApiService.pullData();
      if (!pullResult.success && !pullResult.message?.includes('offline')) {
        throw new Error(`Pull failed: ${pullResult.message}`);
      }

      // Then push local changes
      const pushResult = await syncApiService.pushData();
      if (!pushResult.success && !pushResult.message?.includes('offline')) {
        throw new Error(`Push failed: ${pushResult.message}`);
      }

      setSyncResult({
        pull: pullResult.success,
        push: pushResult.success,
        details: pushResult.data?.results || {}
      });
    } catch (error) {
      Alert.alert('Sync Error', error.message);
    } finally {
      setSyncing(false);
      checkSyncStatus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="sync" size={64} color="#2196F3" />
        <Text style={styles.title}>Data Synchronization</Text>
        <Text style={styles.subtitle}>Sync your data with the server</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Sync Status</Text>
        <View style={styles.statusRow}>
          <Icon name="cloud-off" size={20} color={lastSync ? '#4CAF50' : '#FF9800'} />
          <Text style={styles.statusText}>
            {lastSync
              ? `Last synced: ${new Date(lastSync).toLocaleString()}`
              : 'Never synced'}
          </Text>
        </View>

        {syncStatus?.offline && (
          <View style={styles.offlineBadge}>
            <Icon name="wifi-off" size={16} color="#fff" />
            <Text style={styles.offlineText}>Offline Mode</Text>
          </View>
        )}

        {unsyncedCount > 0 && (
          <View style={styles.unsyncedBanner}>
            <Icon name="warning" size={16} color="#FF9800" />
            <Text style={styles.unsyncedText}>{unsyncedCount} records waiting to be synced</Text>
          </View>
        )}
      </View>

      {syncResult && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Sync Result</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Pull:</Text>
            <Icon name={syncResult.pull ? 'check-circle' : 'error'} size={20} color={syncResult.pull ? '#4CAF50' : '#F44336'} />
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Push:</Text>
            <Icon name={syncResult.push ? 'check-circle' : 'error'} size={20} color={syncResult.push ? '#4CAF50' : '#F44336'} />
          </View>
          {syncResult.details && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Records:</Text>
              <Text style={styles.detailsText}>
                Patients: {syncResult.details.patients?.created || 0} created, {syncResult.details.patients?.updated || 0} updated
              </Text>
              <Text style={styles.detailsText}>
                Visits: {syncResult.details.visits?.created || 0} created, {syncResult.details.visits?.updated || 0} updated
              </Text>
              <Text style={styles.detailsText}>
                Tasks: {syncResult.details.tasks?.created || 0} created
              </Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
        onPress={handleSync}
        disabled={syncing}
      >
        <Icon name={syncing ? 'hourglass-empty' : 'sync'} size={24} color="#fff" />
        <Text style={styles.syncButtonText}>
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Icon name="info" size={20} color="#2196F3" />
        <Text style={styles.infoText}>
          Data will be synced automatically when you have internet connectivity.
          Unsynced data is stored locally on your device.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 15 },
  subtitle: { fontSize: 14, color: '#666' },
  statusCard: { backgroundColor: '#fff', borderRadius: 10, padding: 20, marginBottom: 20 },
  statusTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusText: { marginLeft: 10, color: '#666' },
  offlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF9800', padding: 8, borderRadius: 5, alignSelf: 'flex-start' },
  offlineText: { color: '#fff', marginLeft: 5 },
  resultCard: { backgroundColor: '#fff', borderRadius: 10, padding: 20, marginBottom: 20 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  resultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  resultLabel: { flex: 1, fontSize: 14, color: '#666' },
  detailsContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  detailsTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  detailsText: { fontSize: 12, color: '#666' },
  syncButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2196F3', padding: 15, borderRadius: 10, marginBottom: 20 },
  syncButtonDisabled: { backgroundColor: '#ccc' },
  syncButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  infoCard: { flexDirection: 'row', backgroundColor: '#E3F2FD', padding: 15, borderRadius: 10 },
  infoText: { flex: 1, marginLeft: 10, color: '#1976D2', fontSize: 12 },
  unsyncedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#FFE0B2'
  },
  unsyncedText: {
    marginLeft: 10,
    color: '#E65100',
    fontSize: 12,
    fontWeight: 'bold'
  }
});

export default SyncScreen;
