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
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
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
    { label: 'Nutrition', value: onboardingData.nutritionGoals?.join(', ') },
    { label: 'Experience', value: onboardingData.experience },
    { label: 'Equipment', value: onboardingData.equipment?.join(', ') || onboardingData.equipment },
    { label: 'Frequency', value: `${onboardingData.trainingDays} days/week` },
    { label: 'Duration', value: `${onboardingData.sessionDuration} min` },
    { label: 'Style', value: onboardingData.coachingStyle },
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
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.accent, COLORS.accentSecondary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.topSection}>
              <Text style={styles.title}>Analyzing Your Profile</Text>
              <Text style={styles.subtitle}>Creating your personalized plan...</Text>
            </View>

            <View style={styles.answersContainer}>
            {answers.map((answer, index) => {
              if (index > currentIndex) return null;
              
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.answerItem,
                    index === currentIndex && {
                      opacity: fadeAnim,
                      transform: [{ scale: scaleAnim }],
                    },
                  ]}
                >
                  <View style={styles.answerRow}>
                    <Text style={styles.answerText}>
                      {answer.label}: {answer.value}
                    </Text>
                    {index < currentIndex && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
                    )}
                    {index === currentIndex && (
                      <Animated.View style={{ opacity: fadeAnim }}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
                      </Animated.View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
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
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.accent,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  topSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 40,
  },
  answersContainer: {
    alignItems: 'center',
    gap: 12,
    maxWidth: '90%',
  },
  answerItem: {
    marginBottom: 8,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 24,
  },
  spinner: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    opacity: 0.9,
  },
});
