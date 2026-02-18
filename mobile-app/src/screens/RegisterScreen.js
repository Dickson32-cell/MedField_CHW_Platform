import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { authService } from '../services/api';

const RegisterScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'chw'
    });
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        const { username, email, password, first_name, last_name, phone } = formData;
        if (!username || !email || !password || !first_name || !last_name || !phone) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        const result = await authService.register(formData);
        setLoading(false);

        if (result.success) {
            Alert.alert(
                'Registration Sent',
                'Your account request has been sent to the Administrator for approval. You will be able to log in once approved.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } else {
            Alert.alert('Registration Failed', result.message || 'Error creating account');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>MedField CHW Registration</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                    style={styles.input}
                    value={formData.first_name}
                    onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                    placeholder="e.g. John"
                />

                <Text style={styles.label}>Last Name</Text>
                <TextInput
                    style={styles.input}
                    value={formData.last_name}
                    onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                    placeholder="e.g. Doe"
                />

                <Text style={styles.label}>Email Address</Text>
                <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    placeholder="email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    placeholder="+233..."
                    keyboardType="phone-pad"
                />

                <Text style={styles.label}>Username</Text>
                <TextInput
                    style={styles.input}
                    value={formData.username}
                    onChangeText={(text) => setFormData({ ...formData, username: text })}
                    placeholder="Choose a username"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    placeholder="Choose a secure password"
                    secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Request Account</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.linkText}>Already have an account? Login</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#2196F3' },
    content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 16, color: '#fff', opacity: 0.9, marginTop: 5 },
    form: { backgroundColor: '#fff', borderRadius: 10, padding: 20, elevation: 5 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
    button: { backgroundColor: '#1976D2', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    link: { marginTop: 20, alignItems: 'center' },
    linkText: { color: '#2196F3', fontSize: 14, fontWeight: '500' }
});

export default RegisterScreen;
