import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const VisitsScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Visit History</Text>
    <Text>Visit history list will appear here</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 }
});

export default VisitsScreen;
