import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  green: '#4CAF50',
};

export default function AnalyzingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  const onboardingData = params.onboardingData ? JSON.parse(params.onboardingData as string) : {};
  const coachName = params.coachName as string;

  const answers = [
    { label: 'Name', value: onboardingData.name },
    { label: 'Goals', value: onboardingData.fitnessGoals?.join(', ') || onboardingData.goal },
    { label: 'Nutrition Goals', value: onboardingData.nutritionGoals?.join(', ') },
    { label: 'Experience', value: onboardingData.experience },
    { label: 'Equipment', value: onboardingData.equipment?.join(', ') || onboardingData.equipment },
    { label: 'Training Days', value: `${onboardingData.trainingDays} days/week` },
    { label: 'Session Duration', value: `${onboardingData.sessionDuration} minutes` },
    { label: 'Coaching Style', value: onboardingData.coachingStyle },
  ].filter(item => item.value);

  useEffect(() => {
    if (currentIndex < answers.length) {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(() => {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.8);
            setCurrentIndex(currentIndex + 1);
          }, 600);
        });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => {
        router.replace({
          pathname: '/(auth)/coach-reveal',
          params: { coachName, onboardingData: params.onboardingData },
        });
      }, 1000);
    }
  }, [currentIndex]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.accent, COLORS.accentSecondary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Analyzing Your Profile</Text>
          <Text style={styles.subtitle}>Creating your personalized plan...</Text>

          <View style={styles.answersContainer}>
            {answers.map((answer, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.answerItem,
                  {
                    opacity: index <= currentIndex ? 1 : 0.3,
                  },
                ]}
              >
                <View style={styles.answerLeft}>
                  {index === currentIndex ? (
                  <Animated.View style={[
                    styles.checkmark,
                    styles.checkmarkComplete,
                    { 
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }],
                    }
                  ]}>
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  </Animated.View>
                ) : (
                  <View style={[
                    styles.checkmark,
                    index < currentIndex && styles.checkmarkComplete,
                  ]}>
                    {index < currentIndex ? (
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    ) : (
                      <View style={styles.checkmarkEmpty} />
                    )}
                  </View>
                )}
                  <View style={styles.answerText}>
                    <Text style={styles.answerLabel}>{answer.label}</Text>
                    <Text style={styles.answerValue}>{answer.value}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          <View style={styles.loadingContainer}>
            <View style={styles.spinner}>
              <Ionicons name="fitness" size={32} color={COLORS.white} />
            </View>
            <Text style={styles.loadingText}>
              {currentIndex < answers.length ? 'Processing...' : 'Almost ready!'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 40,
  },
  answersContainer: {
    flex: 1,
    gap: 16,
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
  },
  answerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkmarkComplete: {
    backgroundColor: COLORS.green,
  },
  checkmarkEmpty: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  answerText: {
    flex: 1,
  },
  answerLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 2,
  },
  answerValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.9,
  },
});
