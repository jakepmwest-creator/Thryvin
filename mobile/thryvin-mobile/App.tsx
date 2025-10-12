import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Import main app component
import MainTabNavigator from './src/navigation/MainTabNavigator';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#7A3CF3" />
      <MainTabNavigator />
    </View>
  );
}