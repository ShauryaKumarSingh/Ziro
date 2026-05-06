import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#fff', tabBarStyle: { backgroundColor: '#1B2330', borderTopWidth: 0 } }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} /> }}
      />
      <Tabs.Screen
        name="maps"
        options={{ title: 'Map', tabBarIcon: ({ color }) => <Ionicons name="map" size={28} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person" size={28} color={color} /> }}
      />
      <Tabs.Screen
        name="geofence"
        options={{ title: 'Geofence', tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark" size={28} color={color} /> }}
      />
      <Tabs.Screen
        name="kyc" // The actual screen file
        options={{
          // This hides the screen from the tab bar
          href: null,
        }}
      />
    </Tabs>
  );
}