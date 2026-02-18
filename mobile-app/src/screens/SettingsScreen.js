import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = React.useState(true);
  const [autoSync, setAutoSync] = React.useState(true);

  const MenuItem = ({ icon, title, subtitle, onPress, right }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Icon name={icon} size={24} color="#2196F3" />
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <MenuItem
          icon="person"
          title="Profile"
          subtitle="View and edit your profile"
          onPress={() => navigation.navigate('Profile')}
          right={<Icon name="chevron-right" size={24} color="#ccc" />}
        />
        <MenuItem
          icon="home"
          title="Households"
          subtitle="Manage households"
          onPress={() => navigation.navigate('Households')}
          right={<Icon name="chevron-right" size={24} color="#ccc" />}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync</Text>
        <MenuItem
          icon="sync"
          title="Sync Data"
          subtitle="Sync your offline data"
          onPress={() => navigation.navigate('Sync')}
          right={<Icon name="chevron-right" size={24} color="#ccc" />}
        />
        <View style={styles.menuItem}>
          <Icon name="autorenew" size={24} color="#2196F3" />
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Auto Sync</Text>
            <Text style={styles.menuSubtitle}>Sync when connected</Text>
          </View>
          <Switch value={autoSync} onValueChange={setAutoSync} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <MenuItem
          icon="notifications"
          title="Notifications"
          subtitle="Manage notifications"
          right={<Switch value={notifications} onValueChange={setNotifications} />}
        />
        <MenuItem
          icon="info"
          title="About"
          subtitle="MedField v1.1.0"
          onPress={() => navigation.navigate('About')}
          right={<Icon name="chevron-right" size={24} color="#ccc" />}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginLeft: 15, marginBottom: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuContent: { flex: 1, marginLeft: 15 },
  menuTitle: { fontSize: 16, color: '#333' },
  menuSubtitle: { fontSize: 12, color: '#888', marginTop: 2 }
});

export default SettingsScreen;
