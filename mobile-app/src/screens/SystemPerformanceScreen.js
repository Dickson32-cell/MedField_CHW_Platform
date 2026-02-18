import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { scalingApiService } from '../services/api';

const SystemPerformanceScreen = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        setLoading(true);
        const result = await scalingApiService.getMetrics();
        if (result.success) {
            setMetrics(result.data);
        } else {
            Alert.alert('Error', result.message || 'Failed to fetch metrics');
        }
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMetrics();
        setRefreshing(false);
    };

    const MetricCard = ({ title, value, unit, icon, color }) => (
        <View style={styles.metricCard}>
            <Icon name={icon} size={24} color={color} />
            <View style={styles.metricContent}>
                <Text style={styles.metricTitle}>{title}</Text>
                <Text style={styles.metricValue}>{value}{unit}</Text>
            </View>
        </View>
    );

    const latest = metrics ? metrics[metrics.length - 1] : null;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
            ) : latest ? (
                <View style={styles.content}>
                    <Text style={styles.sectionTitle}>Real-time Health</Text>
                    <View style={styles.grid}>
                        <MetricCard
                            title="Avg CPU"
                            value={latest.avgCpu.toFixed(1)}
                            unit="%"
                            icon="memory"
                            color="#F44336"
                        />
                        <MetricCard
                            title="Avg Memory"
                            value={(latest.avgMemory / (1024 * 1024)).toFixed(0)}
                            unit="MB"
                            icon="storage"
                            color="#2196F3"
                        />
                        <MetricCard
                            title="Active Workers"
                            value={latest.workerCount}
                            unit=""
                            icon="dns"
                            color="#4CAF50"
                        />
                        <MetricCard
                            title="Request Rate"
                            value={latest.requestCount || 0}
                            unit=" req/m"
                            icon="speed"
                            color="#FF9800"
                        />
                    </View>

                    <Text style={styles.sectionTitle}>Backend Environment</Text>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoText}>Node.js Cluster Mode: Enabled</Text>
                        <Text style={styles.infoText}>System Monitoring: Active</Text>
                        <Text style={styles.infoText}>Last Data Point: {new Date(latest.timestamp).toLocaleTimeString()}</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Icon name="insert-chart" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No metrics available</Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { padding: 15 },
    loader: { marginTop: 100 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, marginTop: 10 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    metricCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2
    },
    metricContent: { marginLeft: 10 },
    metricTitle: { fontSize: 12, color: '#666' },
    metricValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    infoCard: { backgroundColor: '#fff', borderRadius: 8, padding: 15, elevation: 2 },
    infoText: { fontSize: 14, color: '#444', marginBottom: 5 },
    emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 10, color: '#999', fontSize: 16 }
});

export default SystemPerformanceScreen;
