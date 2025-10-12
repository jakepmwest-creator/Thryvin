import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, Ionicons, LinearGradient } from '../components/TempComponents';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import NutritionScreen from '../screens/NutritionScreen';
import AwardsScreen from '../screens/AwardsScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { brandColors } from '../theme/theme';

type TabName = 'Home' | 'Workouts' | 'Nutrition' | 'Awards' | 'Profile';

interface TabConfig {
  name: TabName;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  component: React.ComponentType;
}

const tabs: TabConfig[] = [
  {
    name: 'Home',
    icon: 'home-outline',
    iconFocused: 'home',
    component: HomeScreen,
  },
  {
    name: 'Workouts',
    icon: 'barbell-outline',
    iconFocused: 'barbell',
    component: WorkoutsScreen,
  },
  {
    name: 'Nutrition',
    icon: 'nutrition-outline',
    iconFocused: 'nutrition',
    component: NutritionScreen,
  },
  {
    name: 'Awards',
    icon: 'trophy-outline',
    iconFocused: 'trophy',
    component: AwardsScreen,
  },
  {
    name: 'Profile',
    icon: 'person-outline',
    iconFocused: 'person',
    component: ProfileScreen,
  },
];

export default function MainTabNavigator() {
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  
  const ActiveComponent = tabs.find(tab => tab.name === activeTab)?.component || HomeScreen;

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        <ActiveComponent />
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          const iconName = isActive ? tab.iconFocused : tab.icon;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.name)}
              activeOpacity={0.7}
            >
              {isActive ? (
                <LinearGradient
                  colors={brandColors.gradient}
                  style={styles.activeIconContainer}
                >
                  <Ionicons name={iconName} size={24} color="white" />
                </LinearGradient>
              ) : (
                <View style={styles.iconContainer}>
                  <Ionicons name={iconName} size={24} color={brandColors.gray600} />
                </View>
              )}
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? brandColors.primary : brandColors.gray600 }
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.white,
  },
  contentContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: brandColors.white,
    borderTopWidth: 1,
    borderTopColor: brandColors.gray100,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});