import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  gradientStart: '#A259FF',
  gradientEnd: '#FF4EC7',
  white: '#FFFFFF',
};

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  const contentScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const completedRef = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onAnimationComplete?.();
    };

    // Single smooth spring: scale 0.8 → 1.0 + fade in simultaneously
    const entranceAnim = Animated.parallel([
      Animated.spring(contentScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]);

    // Tagline fades in shortly after the logo
    const taglineFade = Animated.timing(taglineOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      delay: 250,
    });

    // Fade out at 1.4s, finish at ~1.8s total
    const fadeOut = Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
      delay: 1400,
    });

    // Run entrance then fade out
    Animated.sequence([
      Animated.parallel([entranceAnim, taglineFade]),
      fadeOut,
    ]).start(() => {
      finish();
    });

    // Safety fallback at 2.5s max
    const fallbackTimeout = setTimeout(() => {
      finish();
    }, 2500);

    return () => {
      clearTimeout(fallbackTimeout);
    };
  }, [contentOpacity, contentScale, containerOpacity, taglineOpacity, onAnimationComplete]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Subtle bg decoration circles — very low opacity */}
        <View style={[styles.bgCircle, styles.bgCircle1]} />
        <View style={[styles.bgCircle, styles.bgCircle2]} />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ scale: contentScale }],
            },
          ]}
        >
          {/* Logo on white circle */}
          <View style={styles.logoContainer}>
            <View style={styles.whiteCircle} />
            <Image
              source={require('../../assets/images/thryvin-logo-final.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Wordmark */}
          <Text style={styles.wordmark}>THRYVIN</Text>

          {/* Tagline */}
          <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
            Train Smart. Live Better.
          </Animated.Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  bgCircle1: {
    width: SCREEN_WIDTH * 1.6,
    height: SCREEN_WIDTH * 1.6,
    top: -SCREEN_WIDTH * 0.55,
    right: -SCREEN_WIDTH * 0.5,
  },
  bgCircle2: {
    width: SCREEN_WIDTH * 1.0,
    height: SCREEN_WIDTH * 1.0,
    bottom: -SCREEN_WIDTH * 0.35,
    left: -SCREEN_WIDTH * 0.35,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 24,
  },
  whiteCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 14,
  },
  logo: {
    width: 160,
    height: 160,
    zIndex: 1,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 6,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.6,
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
