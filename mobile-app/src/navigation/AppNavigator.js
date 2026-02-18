import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PatientsScreen from '../screens/PatientsScreen';
import PatientDetailScreen from '../screens/PatientDetailScreen';
import AddPatientScreen from '../screens/AddPatientScreen';
import VisitsScreen from '../screens/VisitsScreen';
import NewVisitScreen from '../screens/NewVisitScreen';
import TasksScreen from '../screens/TasksScreen';
import HouseholdsScreen from '../screens/HouseholdsScreen';
import AddHouseholdScreen from '../screens/AddHouseholdScreen';
import ReferralsScreen from '../screens/ReferralsScreen';
import SyncScreen from '../screens/SyncScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import SystemPerformanceScreen from '../screens/SystemPerformanceScreen';
import ScalingConfigScreen from '../screens/ScalingConfigScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for main app
const TabNavigator = ({ route }) => {
  const { role } = route.params || {};

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard': iconName = 'dashboard'; break;
            case 'Patients': iconName = 'people'; break;
            case 'Tasks': iconName = 'assignment'; break;
            case 'Sync': iconName = 'sync'; break;
            case 'Settings': iconName = 'settings'; break;
            default: iconName = 'circle';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { paddingBottom: 5, height: 60 },
        headerShown: false
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} initialParams={{ role }} />
      <Tab.Screen
        name="Patients"
        component={PatientsScreen}
        options={{
          tabBarButton: role === 'admin' ? () => null : undefined
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarButton: role === 'admin' ? () => null : undefined
        }}
      />
      <Tab.Screen name="Sync" component={SyncScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// Main Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerShown: false,
          headerStyle: { backgroundColor: '#2196F3' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: ({ canGoBack }) => canGoBack ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 0, padding: 5 }}>
              <Icon name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
          ) : null
        })}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: true, title: 'Create Account' }} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ headerShown: true, title: 'Patient Details' }} />
        <Stack.Screen name="AddPatient" component={AddPatientScreen} options={{ headerShown: true, title: 'Register Patient' }} />
        <Stack.Screen name="Visits" component={VisitsScreen} options={{ headerShown: true, title: 'Visit History' }} />
        <Stack.Screen name="NewVisit" component={NewVisitScreen} options={{ headerShown: true, title: 'New Visit' }} />
        <Stack.Screen name="Households" component={HouseholdsScreen} options={{ headerShown: true, title: 'Households' }} />
        <Stack.Screen name="AddHousehold" component={AddHouseholdScreen} options={{ headerShown: true, title: 'Register Household' }} />
        <Stack.Screen name="Referrals" component={ReferralsScreen} options={{ headerShown: true, title: 'Referrals' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: 'Profile' }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: true, title: 'About MedField' }} />
        <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ headerShown: true, title: 'User Management' }} />
        <Stack.Screen name="SystemPerformance" component={SystemPerformanceScreen} options={{ headerShown: true, title: 'System Performance' }} />
        <Stack.Screen name="ScalingConfig" component={ScalingConfigScreen} options={{ headerShown: true, title: 'Scaling Configuration' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
