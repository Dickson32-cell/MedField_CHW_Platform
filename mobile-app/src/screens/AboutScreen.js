import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Linking } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const AboutScreen = () => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Icon name="health-and-safety" size={80} color="#2196F3" />
                <Text style={styles.title}>MedField CHW Platform</Text>
                <Text style={styles.version}>Version 1.1.0</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About the Software</Text>
                <Text style={styles.description}>
                    MedField is an advanced, offline-first Community Health Worker (CHW) platform
                    designed to optimize maternal and child health outcomes in rural and remote settings.

                    Built with resilience in mind, it provides clinical decision support based on
                    standard WHO iCCM protocols, real-time sync with DHIS2, and comprehensive
                    patient tracking from pregnancy to child development.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Developer</Text>
                <View style={styles.developerCard}>
                    <Icon name="person" size={40} color="#666" />
                    <View style={styles.devInfo}>
                        <Text style={styles.devName}>Abdul Rashid Dickson</Text>
                        <Text style={styles.devTitle}>Lead Developer & Architect</Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Features</Text>
                <View style={styles.featureItem}>
                    <Icon name="offline-bolt" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>Offline-First PouchDB Storage</Text>
                </View>
                <View style={styles.featureItem}>
                    <Icon name="biotech" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>iCCM Clinical Protocols</Text>
                </View>
                <View style={styles.featureItem}>
                    <Icon name="cloud-upload" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>DHIS2 & FHIR Integration</Text>
                </View>
                <View style={styles.featureItem}>
                    <Icon name="trending-up" size={20} color="#4CAF50" />
                    <Text style={styles.featureText}>Auto-Scaling Backend Architecture</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>© 2026 MedField Project</Text>
                <Text style={styles.footerText}>All Rights Reserved</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#2196F3', marginTop: 15 },
    version: { fontSize: 14, color: '#666', marginTop: 5 },
    section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
    description: { fontSize: 16, color: '#555', lineHeight: 24 },
    developerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 10
    },
    devInfo: { marginLeft: 15 },
    devName: { fontSize: 18, fontWeight: 'bold', color: '#2196F3' },
    devTitle: { fontSize: 14, color: '#666' },
    featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    featureText: { fontSize: 15, color: '#444', marginLeft: 10 },
    footer: { padding: 40, alignItems: 'center' },
    footerText: { fontSize: 12, color: '#999' }
});

export default AboutScreen;
