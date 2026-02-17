import { Tabs, Redirect, useRouter } from 'expo-router';
import { SlidingTabBar } from '../../src/components/SlidingTabBar';
import { useAuthStore } from '../../src/stores/auth-store';
import { OnboardingTour } from '../../src/components/OnboardingTour';
import { useTour } from '../../src/hooks/useTour';

export default function TabLayout() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const {
    showTour,
    currentStep,
    tourSteps,
    nextStep,
    skipTour,
    completeTour,
  } = useTour();

  // Navigate to the correct tab when a step has a tab target
  const handleNext = () => {
    const nextIndex = currentStep + 1;
    if (nextIndex < tourSteps.length) {
      const nextTab = tourSteps[nextIndex].tab;
      if (nextTab) {
        router.navigate(`/(tabs)/${nextTab === 'index' ? '' : nextTab}`);
      }
    }
    nextStep();
  };

  const handleComplete = () => {
    router.navigate('/(tabs)/');
    completeTour();
  };

  // Protect all tabs - redirect to login if not authenticated
  if (!isLoading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
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
            href: null,
          }} 
        />

        {/* Hidden Pro Comparison */}
        <Tabs.Screen
          name="pro"
          options={{
            title: 'Thryvin\' Pro',
            href: null,
          }}
        />
      </Tabs>

      <OnboardingTour
        visible={showTour}
        steps={tourSteps}
        currentStep={currentStep}
        onNext={handleNext}
        onSkip={skipTour}
        onComplete={handleComplete}
      />
    </>
  );
}
