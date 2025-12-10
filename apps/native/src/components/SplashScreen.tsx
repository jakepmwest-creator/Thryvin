import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Easing,
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
  // Animation values
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoBounce = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous subtle glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Main animation sequence
    Animated.sequence([
      // White circle appears
      Animated.parallel([
        Animated.spring(circleScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(circleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      
      // Logo appears and bounces
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 35,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      // Bounce animation (3 times)
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoBounce, {
            toValue: -15,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(logoBounce, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ),

      // Hold for a moment
      Animated.delay(400),

      // Fade out
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationComplete?.();
    });
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated background circles */}
        <Animated.View style={[styles.bgCircle, styles.bgCircle1, { opacity: glowOpacity }]} />
        <Animated.View style={[styles.bgCircle, styles.bgCircle2, { opacity: glowOpacity }]} />

        {/* Content - Just logo on white circle */}
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoCircleContainer,
              {
                opacity: circleOpacity,
                transform: [{ scale: circleScale }],
              },
            ]}
          >
            {/* Animated glow */}
            <Animated.View
              style={[
                styles.logoGlow,
                {
                  opacity: glowOpacity,
                  transform: [{ scale: glowScale }],
                },
              ]}
            />

            {/* White circle background */}
            <View style={styles.whiteCircle} />

            {/* Your actual Thryvin logo */}
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  opacity: logoOpacity,
                  transform: [
                    { scale: logoScale },
                    { translateY: logoBounce },
                  ],
                },
              ]}
            >
              <Image
                source={require('../../assets/images/thryvin-logo-final.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
        </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bgCircle1: {
    width: SCREEN_WIDTH * 1.8,
    height: SCREEN_WIDTH * 1.8,
    top: -SCREEN_WIDTH * 0.6,
    right: -SCREEN_WIDTH * 0.6,
  },
  bgCircle2: {
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    bottom: -SCREEN_WIDTH * 0.4,
    left: -SCREEN_WIDTH * 0.4,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircleContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  whiteCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 12,
  },
  logoWrapper: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 160,
  },
});

export default SplashScreen;
