import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const HouseholdsScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Households</Text>
    <Text>Household list will appear here</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 }
});

export default HouseholdsScreen;
