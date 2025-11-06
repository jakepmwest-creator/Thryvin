import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  // Fitness theme
  fitnessAccent: '#a259ff',
  fitnessSecondary: '#3a86ff',
  
  // Nutrition theme
  nutritionAccent: '#4CAF50',
  nutritionSecondary: '#8BC34A',
  
  white: '#ffffff',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

type AppMode = 'fitness' | 'nutrition';

const FITNESS_TABS = [
  { name: 'index', icon: 'home', label: 'Home' },
  { name: 'workouts', icon: 'fitness', label: 'Workouts' },
  { name: 'stats', icon: 'bar-chart', label: 'Stats' },
  { name: 'awards', icon: 'trophy', label: 'Awards' },
];

const NUTRITION_TABS = [
  { name: 'nutrition-home', icon: 'restaurant', label: 'Home' },
  { name: 'meal-plan', icon: 'calendar', label: 'Meals' },
  { name: 'shopping', icon: 'cart', label: 'Shopping' },
  { name: 'explore', icon: 'compass', label: 'Explore' },
];

export function SlidingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<AppMode>('fitness');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;

  const currentTabs = mode === 'fitness' ? FITNESS_TABS : NUTRITION_TABS;
  const gradientColors: [string, string] = mode === 'fitness' 
    ? [COLORS.fitnessAccent, COLORS.fitnessSecondary]
    : [COLORS.nutritionAccent, COLORS.nutritionSecondary];

  const handleToggle = () => {
    const newMode: AppMode = mode === 'fitness' ? 'nutrition' : 'fitness';
    setMode(newMode);

    // Animate slider
    Animated.spring(slideAnim, {
      toValue: newMode === 'nutrition' ? 1 : 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();

    // Animate colors
    Animated.timing(colorAnim, {
      toValue: newMode === 'nutrition' ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Navigate to first tab of new mode
    const firstTab = newMode === 'fitness' ? 'index' : 'nutrition-home';
    navigation.navigate(firstTab);
  };

  const isTabActive = (tabName: string) => {
    const currentRoute = state.routes[state.index].name;
    return currentRoute === tabName;
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.tabsContainer}>
          {/* Toggle Button - LEFT side when in Nutrition mode */}
          {(mode === 'nutrition') && (
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={handleToggle}
              activeOpacity={0.8}
            >
              <View style={styles.toggleTrack}>
                <Animated.View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [{
                        translateX: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [2, 22],
                        }),
                      }],
                    },
                  ]}
                />
                <View style={styles.toggleIcons}>
                  <Ionicons
                    name="fitness"
                    size={14}
                    color={mode === 'fitness' ? COLORS.white : 'rgba(255,255,255,0.3)'}
                    style={styles.toggleIcon}
                  />
                  <Ionicons
                    name="nutrition"
                    size={14}
                    color={mode === 'nutrition' ? COLORS.white : 'rgba(255,255,255,0.3)'}
                    style={styles.toggleIcon}
                  />
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Tabs */}
          <View style={styles.tabs}>
            {currentTabs.map((tab, index) => {
              const isActive = isTabActive(tab.name);
              
              return (
                <TouchableOpacity
                  key={tab.name}
                  style={styles.tab}
                  onPress={() => navigation.navigate(tab.name)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabContent, isActive && styles.tabContentActive]}>
                    <Ionicons
                      name={tab.icon as any}
                      size={24}
                      color={COLORS.white}
                      style={{ opacity: isActive ? 1 : 0.6 }}
                    />
                    <Text style={[styles.tabLabel, { opacity: isActive ? 1 : 0.6 }]}>
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Toggle Button - RIGHT side when in Fitness mode */}
          {(mode === 'fitness') && (
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={handleToggle}
              activeOpacity={0.8}
            >
              <View style={styles.toggleTrack}>
                <Animated.View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [{
                        translateX: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [2, 22],
                        }),
                      }],
                    },
                  ]}
                />
                <View style={styles.toggleIcons}>
                  <Ionicons
                    name="fitness"
                    size={14}
                    color={mode === 'fitness' ? COLORS.white : 'rgba(255,255,255,0.3)'}
                    style={styles.toggleIcon}
                  />
                  <Ionicons
                    name="nutrition"
                    size={14}
                    color={mode === 'nutrition' ? COLORS.white : 'rgba(255,255,255,0.3)'}
                    style={styles.toggleIcon}
                  />
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  gradient: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContentActive: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 4,
  },
  toggleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    position: 'relative',
  },
  toggleThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  toggleIcon: {
    marginHorizontal: 2,
  },
});
