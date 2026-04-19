import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen    from '../screens/DashboardScreen';
import AccountsScreen     from '../screens/AccountsScreen';
import AIAssistantScreen  from '../screens/AIAssistantScreen';
import PaymentsScreen     from '../screens/PaymentsScreen';
import ReportsScreen      from '../screens/ReportsScreen';
import CustomTabBar       from './CustomTabBar';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard"  component={DashboardScreen} />
      <Tab.Screen name="Accounts"   component={AccountsScreen} />
      <Tab.Screen name="AI"         component={AIAssistantScreen} />
      <Tab.Screen name="Payments"   component={PaymentsScreen} />
      <Tab.Screen name="Reports"    component={ReportsScreen} />
    </Tab.Navigator>
  );
}
