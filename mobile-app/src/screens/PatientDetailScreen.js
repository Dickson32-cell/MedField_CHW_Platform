import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const PatientDetailScreen = ({ route, navigation }) => {
  const { patientId } = route.params || {};

  return (
    <View style={styles.container}>
      <Text>Patient Detail - {patientId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default PatientDetailScreen;
