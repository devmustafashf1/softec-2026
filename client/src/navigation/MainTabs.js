import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import AccountsScreen from '../screens/AccountsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import CustomTabBar from './CustomTabBar';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Accounts"  component={AccountsScreen} />
      <Tab.Screen name="Messages"  component={PlaceholderScreen} />
      <Tab.Screen name="Payments"  component={PlaceholderScreen} />
      <Tab.Screen name="Reports"   component={ReportsScreen} />
    </Tab.Navigator>
  );
}
