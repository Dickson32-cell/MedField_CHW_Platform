import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { scalingApiService } from '../services/api';

const ScalingConfigScreen = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingAction, setPendingAction] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        setLoading(true);
        const result = await scalingApiService.getStatus();
        if (result.success) {
            setStatus(result.data);
        }
        setLoading(false);
    };

    const handleTrigger = async (action, target = null) => {
        Alert.alert(
            'Confirm Action',
            `Are you sure you want to trigger ${action}${target ? ' to ' + target : ''}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        setPendingAction(true);
                        const result = await scalingApiService.trigger(action, target);
                        if (result.success) {
                            Alert.alert('Success', result.message);
                            fetchStatus();
                        } else {
                            Alert.alert('Error', result.message || 'Failed to trigger action');
                        }
                        setPendingAction(false);
                    }
                }
            ]
        );
    };

    const ConfigCard = ({ title, description, children }) => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
            {children}
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
            ) : (
                <View style={styles.content}>
                    <ConfigCard
                        title="Horizontal Scaling"
                        description="Manage the number of worker processes in the Node.js cluster."
                    >
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.scaleUp]}
                                onPress={() => handleTrigger('scale-up')}
                                disabled={pendingAction}
                            >
                                <Icon name="add" size={20} color="#fff" />
                                <Text style={styles.buttonLabel}>Scale Up</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.scaleDown]}
                                onPress={() => handleTrigger('scale-down')}
                                disabled={pendingAction}
                            >
                                <Icon name="remove" size={20} color="#fff" />
                                <Text style={styles.buttonLabel}>Scale Down</Text>
                            </TouchableOpacity>
                        </View>
                    </ConfigCard>

                    <ConfigCard
                        title="Vertical Scaling (Hybrid)"
                        description="Toggle resource-saving features based on system load."
                    >
                        <View style={styles.buttonGrid}>
                            <TouchableOpacity
                                style={styles.gridButton}
                                onPress={() => handleTrigger('vertical', 'performance')}
                                disabled={pendingAction}
                            >
                                <Icon name="bolt" size={24} color="#FF9800" />
                                <Text style={styles.gridLabel}>High Perf</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.gridButton}
                                onPress={() => handleTrigger('vertical', 'balanced')}
                                disabled={pendingAction}
                            >
                                <Icon name="balance" size={24} color="#2196F3" />
                                <Text style={styles.gridLabel}>Balanced</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.gridButton}
                                onPress={() => handleTrigger('vertical', 'efficiency')}
                                disabled={pendingAction}
                            >
                                <Icon name="eco" size={24} color="#4CAF50" />
                                <Text style={styles.gridLabel}>Efficiency</Text>
                            </TouchableOpacity>
                        </View>
                    </ConfigCard>

                    <View style={styles.systemStatus}>
                        <Text style={styles.statusLabel}>Current Strategy: </Text>
                        <Text style={styles.statusValue}>{status?.strategy || 'Auto (Monitor)'}</Text>
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { padding: 15 },
    loader: { marginTop: 100 },
    card: { backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 15, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    cardDescription: { fontSize: 14, color: '#666', marginBottom: 20 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 6,
        width: '48%'
    },
    scaleUp: { backgroundColor: '#4CAF50' },
    scaleDown: { backgroundColor: '#F44336' },
    buttonLabel: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
    buttonGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    gridButton: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        width: '30%'
    },
    gridLabel: { fontSize: 12, marginTop: 5, color: '#444' },
    systemStatus: { alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
    statusLabel: { color: '#888', fontSize: 14 },
    statusValue: { color: '#2196F3', fontWeight: 'bold', fontSize: 14 }
});

export default ScalingConfigScreen;
