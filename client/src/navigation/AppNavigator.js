import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainTabs from './MainTabs';
import AccountDetailScreen from '../screens/AccountDetailScreen';
import ClientLoginScreen from '../screens/client/ClientLoginScreen';
import ClientTabs from './ClientTabs';
import ClientPaymentProofScreen from '../screens/client/ClientPaymentProofScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        {/* Admin portal */}
        <Stack.Screen name="Login"         component={LoginScreen} />
        <Stack.Screen name="Register"      component={RegisterScreen} />
        <Stack.Screen name="Main"          component={MainTabs} />
        <Stack.Screen name="AccountDetail" component={AccountDetailScreen} />

        {/* Client portal */}
        <Stack.Screen name="ClientLogin"        component={ClientLoginScreen} />
        <Stack.Screen name="ClientMain"         component={ClientTabs} />
        <Stack.Screen name="ClientPaymentProof" component={ClientPaymentProofScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
