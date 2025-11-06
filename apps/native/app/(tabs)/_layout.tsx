import { Tabs } from 'expo-router';
import { SlidingTabBar } from '../../src/components/SlidingTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <SlidingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Fitness Tabs */}
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="awards" options={{ title: 'Awards' }} />
      
      {/* Nutrition Tabs */}
      <Tabs.Screen name="nutrition-home" options={{ title: 'Nutrition' }} />
      <Tabs.Screen name="meal-plan" options={{ title: 'Meal Plan' }} />
      <Tabs.Screen name="shopping" options={{ title: 'Shopping' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      
      {/* Hidden Profile (accessible from menu) */}
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          href: null, // Hide from tab bar
        }} 
      />
    </Tabs>
  );
}