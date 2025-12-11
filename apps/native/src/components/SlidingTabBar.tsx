import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { COLORS as THEME_COLORS } from '../constants/colors';

const COLORS = {
  // Fitness theme - PURPLE TO PINK GRADIENT
  fitnessAccent: THEME_COLORS.gradientStart, // #A22BF6
  fitnessSecondary: THEME_COLORS.gradientEnd, // #FF4EC7
  
  // Nutrition theme
  nutritionAccent: '#4CAF50',
  nutritionSecondary: '#8BC34A',
  
  white: '#ffffff',
  shadow: 'rgba(0, 0, 0, 0.1)',
  text: '#222222',
  mediumGray: '#8E8E93',
};

// Nice "Coming Soon" Modal Component
const ComingSoonModal = ({ 
  visible, 
  onClose, 
  title, 
  message, 
  icon 
}: { 
  visible: boolean; 
  onClose: () => void; 
  title: string; 
  message: string; 
  icon: string;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity 
      style={comingSoonStyles.overlay} 
      activeOpacity={1} 
      onPress={onClose}
    >
      <View style={comingSoonStyles.container}>
        <LinearGradient
          colors={[COLORS.fitnessAccent, COLORS.fitnessSecondary]}
          style={comingSoonStyles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon as any} size={40} color={COLORS.white} />
        </LinearGradient>
        
        <Text style={comingSoonStyles.title}>{title}</Text>
        <Text style={comingSoonStyles.message}>{message}</Text>
        
        <TouchableOpacity onPress={onClose} style={comingSoonStyles.buttonWrapper}>
          <LinearGradient
            colors={[COLORS.fitnessAccent, COLORS.fitnessSecondary]}
            style={comingSoonStyles.button}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={comingSoonStyles.buttonText}>Got it!</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
);

const comingSoonStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
});

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
    // Show "Coming Soon" alert for Nutrition
    if (mode === 'fitness') {
      Alert.alert(
        '🥗 Nutrition Coming Soon!',
        'We\'re cooking up something amazing! The Nutrition feature is under development and will be available in a future update.\n\nStay tuned for meal planning, calorie tracking, and more!',
        [{ text: 'Got it!', style: 'default' }]
      );
      return;
    }
    
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
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={[styles.gradient, { paddingBottom: insets.bottom }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.tabsContainer}>
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

          {/* Toggle Button - ALWAYS on the RIGHT side */}
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
