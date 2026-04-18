import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import { COLORS, FONTS, SIZES } from '../constants/theme';

// Placeholder screens for tabs not yet built
function PlaceholderTab({ title }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.lightBg }}>
      <Text style={{ fontSize: SIZES.lg, color: COLORS.navy, ...FONTS.bold }}>{title}</Text>
      <Text style={{ fontSize: SIZES.md, color: COLORS.gray, marginTop: 8 }}>Coming soon</Text>
    </View>
  );
}

function LedgerScreen()  { return <PlaceholderTab title="Ledger" />; }
function EventsScreen()  { return <PlaceholderTab title="Events" />; }
function HelpScreen()    { return <PlaceholderTab title="Help" />; }

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'ClientStatus', label: 'STATUS',  icon: '📊', component: ClientDashboardScreen },
  { name: 'ClientLedger', label: 'LEDGER',  icon: '📒', component: LedgerScreen },
  { name: 'ClientEvents', label: 'EVENTS',  icon: '📅', component: EventsScreen },
  { name: 'ClientHelp',   label: 'HELP',    icon: '❓', component: HelpScreen },
];

function CustomTabBar({ state, navigation }) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.name === route.name);
        const focused = state.index === index;
        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
              {tab?.icon}
            </Text>
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              {tab?.label}
            </Text>
            {focused && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ClientTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TABS.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 8,
    paddingTop: 8,
    height: 64,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIcon: { fontSize: 18, marginBottom: 2, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: {
    fontSize: SIZES.xs,
    color: COLORS.gray,
    letterSpacing: 0.8,
    ...FONTS.semiBold,
  },
  tabLabelActive: { color: COLORS.navy, ...FONTS.bold },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 2,
    backgroundColor: COLORS.navy,
    borderRadius: 2,
  },
});
