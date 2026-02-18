import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { userApiService } from '../services/api';

const UserManagementScreen = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const result = await userApiService.getAll();
        if (result.success) {
            setUsers(result.data);
        } else {
            Alert.alert('Error', result.message || 'Failed to fetch users');
        }
        setLoading(false);
    };

    const handleApprove = async (id, name) => {
        Alert.alert(
            'Approve User',
            `Are you sure you want to approve ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        const result = await userApiService.approve(id);
                        if (result.success) {
                            Alert.alert('Success', 'User approved successfully');
                            fetchUsers();
                        } else {
                            Alert.alert('Error', result.message || 'Failed to approve user');
                        }
                    }
                }
            ]
        );
    };

    const UserItem = ({ item }) => (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.userRole}>{item.role.toUpperCase()}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <View style={styles.userActions}>
                {item.is_approved ? (
                    <View style={styles.approvedBadge}>
                        <Icon name="check-circle" size={16} color="#4CAF50" />
                        <Text style={styles.approvedText}>Approved</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleApprove(item.id, `${item.first_name} ${item.last_name}`)}
                    >
                        <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <UserItem item={item} />}
                    refreshing={refreshing}
                    onRefresh={fetchUsers}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No users found</Text>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    list: { padding: 10 },
    loader: { flex: 1, justifyContent: 'center' },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2
    },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    userRole: { fontSize: 12, color: '#2196F3', fontWeight: 'bold', marginTop: 2 },
    userEmail: { fontSize: 14, color: '#666', marginTop: 2 },
    userActions: { marginLeft: 10 },
    approveButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 4
    },
    approveButtonText: { color: '#fff', fontWeight: 'bold' },
    approvedBadge: { flexDirection: 'row', alignItems: 'center' },
    approvedText: { color: '#4CAF50', marginLeft: 5, fontSize: 14 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#666' }
});

export default UserManagementScreen;
