import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
};

// Confetti particle
const ConfettiParticle = ({ delay }: { delay: number }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const translateX = useRef(new Animated.Value(Math.random() * SCREEN_WIDTH)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: Dimensions.get('window').height + 100,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotate, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }, delay);
  }, []);

  const colors = [COLORS.accent, COLORS.accentSecondary, '#FFD700', '#FF6B6B', '#4ECDC4'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        {
          backgroundColor: color,
          transform: [
            { translateX },
            { translateY },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    />
  );
};

export default function CoachRevealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { register, isLoading } = useAuthStore();

  const coachName = params.coachName as string;
  const onboardingData = params.onboardingData ? JSON.parse(params.onboardingData as string) : {};

  const [stage, setStage] = useState<'loading' | 'reveal'>('loading');

  // Animation values
  const loadingScale = useRef(new Animated.Value(0.8)).current;
  const revealScale = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Loading animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(loadingScale, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // After 3 seconds, show reveal
    setTimeout(() => {
      setStage('reveal');
      Animated.parallel([
        Animated.spring(revealScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 3000);
  }, []);

  const getCoachPersonality = () => {
    const style = onboardingData.coachingStyle || 'balanced';
    const personalities = {
      motivational: 'I\'m here to ignite your fire and push you beyond your limits! Let\'s crush those goals together! 💪',
      technical: 'I\'ll guide you with precision and form-perfect training. Every rep counts, every detail matters. 🎯',
      disciplined: 'No excuses, no shortcuts. We\'re building discipline and strength through structured training. ⚔️',
      balanced: 'Together we\'ll find the perfect balance between intensity and sustainability. Let\'s build lasting results! ⚖️',
    };
    return personalities[style as keyof typeof personalities] || personalities.balanced;
  };

  const getCoachDescription = () => {
    const style = onboardingData.coachingStyle || 'balanced';
    const descriptions = {
      motivational: 'High-energy training focused on pushing limits and achieving peak performance through positive reinforcement.',
      technical: 'Detail-oriented coaching emphasizing perfect form, biomechanics, and progressive overload principles.',
      disciplined: 'Structured, no-nonsense approach building mental toughness and consistency through disciplined training protocols.',
      balanced: 'Well-rounded methodology combining intensity with recovery, creating sustainable long-term fitness habits.',
    };
    return descriptions[style as keyof typeof descriptions] || descriptions.balanced;
  };

  const handleSwitchCoach = () => {
    // Generate a new random coach from the same pool
    const COACH_NAMES = {
      male: {
        motivational: ['Zo Blaze', 'Max Ryder', 'Chase Summit', 'Kai Storm'],
        technical: ['Nathan Pierce', 'Ethan Cross', 'Lucas Kane', 'Owen Sharp'],
        disciplined: ['Marcus Stone', 'Roman Steel', 'Miles Forge', 'Dex Iron'],
        balanced: ['Jordan Rivers', 'Blake Harper', 'Cole Mason', 'Finn Carter'],
      },
      female: {
        motivational: ['Luna Blaze', 'Aria Rush', 'Nova Flame', 'Maya Surge'],
        technical: ['Sage Pierce', 'Quinn Atlas', 'Eva Cross', 'Iris Vale'],
        disciplined: ['Reyna Stone', 'Phoenix Steel', 'Jade Archer', 'Raven Storm'],
        balanced: ['Harper Lane', 'Riley Brooks', 'Skye Morgan', 'Eden Rivers'],
      },
    };

    const gender = onboardingData.gender || 'other';
    const style = onboardingData.coachingStyle || 'balanced';
    
    let coachPool;
    if (gender === 'male') {
      coachPool = COACH_NAMES.male[style] || COACH_NAMES.male.balanced;
    } else if (gender === 'female') {
      coachPool = COACH_NAMES.female[style] || COACH_NAMES.female.balanced;
    } else {
      const allMaleCoaches = Object.values(COACH_NAMES.male).flat();
      const allFemaleCoaches = Object.values(COACH_NAMES.female).flat();
      coachPool = [...allMaleCoaches, ...allFemaleCoaches];
    }
    
    // Filter out current coach
    const otherCoaches = coachPool.filter(name => name !== coachName);
    if (otherCoaches.length > 0) {
      const newCoach = otherCoaches[Math.floor(Math.random() * otherCoaches.length)];
      router.replace({
        pathname: '/(auth)/coach-reveal',
        params: {
          coachName: newCoach,
          onboardingData: params.onboardingData,
        },
      });
    }
  };

  const handleContinue = () => {
    router.push({
      pathname: '/(auth)/quick-signup',
      params: { 
        onboardingData: JSON.stringify({ ...onboardingData, coachName }),
      },
    });
  };

  if (stage === 'loading') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentSecondary]}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView style={styles.safeArea}>
            <Animated.View
              style={[
                styles.loadingContainer,
                { transform: [{ scale: loadingScale }] },
              ]}
            >
              <Text style={styles.loadingEmoji}>🏋️</Text>
              <Text style={styles.loadingTitle}>Creating Your Coach...</Text>
              <Text style={styles.loadingSubtitle}>
                Analyzing your goals and preferences
              </Text>
              
              {/* Loading dots */}
              <View style={styles.loadingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.accent, COLORS.accentSecondary]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Confetti */}
        {Array.from({ length: 30 }).map((_, i) => (
          <ConfettiParticle key={i} delay={i * 100} />
        ))}

        <SafeAreaView style={styles.safeArea}>
          <Animated.View
            style={[
              styles.revealContainer,
              {
                opacity: fadeIn,
                transform: [{ scale: revealScale }],
              },
            ]}
          >
            {/* Celebration */}
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.revealTitle}>Congratulations!</Text>
            <Text style={styles.revealSubtitle}>
              Your personal coach is ready
            </Text>

            {/* Coach Card */}
            <View style={styles.coachCard}>
              <LinearGradient
                colors={[COLORS.white, COLORS.white]}
                style={styles.coachCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Coach Avatar */}
                <View style={styles.coachAvatar}>
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accentSecondary]}
                    style={styles.avatarGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.avatarEmoji}>💪</Text>
                  </LinearGradient>
                </View>

                {/* Coach Name */}
                <Text style={styles.coachName}>Meet {coachName}</Text>
                <Text style={styles.coachRole}>Your Personal AI Coach</Text>

                {/* Coach Personality */}
                <View style={styles.personalityBox}>
                  <Text style={styles.personalityText}>
                    "{getCoachPersonality()}"
                  </Text>
                </View>

                {/* Training Style Description */}
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionLabel}>Training Style</Text>
                  <Text style={styles.descriptionText}>
                    {getCoachDescription()}
                  </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{onboardingData.trainingDays || '5'}</Text>
                    <Text style={styles.statLabel}>Days/Week</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{onboardingData.sessionDuration || '45'}</Text>
                    <Text style={styles.statLabel}>Min/Session</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{onboardingData.experience || 'Int.'}</Text>
                    <Text style={styles.statLabel}>Level</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Switch Coach Button */}
            <TouchableOpacity
              style={styles.switchButton}
              onPress={handleSwitchCoach}
            >
              <Ionicons name="refresh" size={18} color={COLORS.accent} />
              <Text style={styles.switchButtonText}>Switch Coach</Text>
            </TouchableOpacity>

            {/* Continue Button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.continueGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.continueButtonText}>Create My Account</Text>
                <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.hintText}>
              Save your progress and start training!
            </Text>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  confettiParticle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  // Loading Stage
  loadingContainer: {
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  // Reveal Stage
  revealContainer: {
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  revealTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  revealSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 32,
  },
  coachCard: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
    marginBottom: 24,
  },
  coachCardGradient: {
    padding: 32,
    alignItems: 'center',
  },
  coachAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 20,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 48,
  },
  coachName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  coachRole: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  personalityBox: {
    backgroundColor: `${COLORS.accent}10`,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  personalityText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  descriptionBox: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  descriptionLabel: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.mediumGray,
    textAlign: 'left',
    lineHeight: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.lightGray,
  },
  continueButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  continueButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent,
  },
  hintText: {
    marginTop: 16,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
});
