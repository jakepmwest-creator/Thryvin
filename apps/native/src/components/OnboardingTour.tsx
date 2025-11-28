import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  primary: '#A22BF6',
  secondary: '#E94560',
  gradientStart: '#A22BF6',
  gradientEnd: '#E94560',
  white: '#FFFFFF',
  text: '#1C1C1E',
  lightGray: '#F5F5F7',
  mediumGray: '#8E8E93',
};

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetPosition?: { x: number; y: number; width: number; height: number };
  placement: 'top' | 'bottom' | 'center';
  action?: 'tap' | 'none';
  icon?: string;
}

interface OnboardingTourProps {
  visible: boolean;
  steps: TourStep[];
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function OnboardingTour({
  visible,
  steps,
  currentStep,
  onNext,
  onSkip,
  onComplete,
}: OnboardingTourProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, currentStep]);

  if (!visible || !step) return null;

  const renderSpotlight = () => {
    if (!step.targetPosition) return null;

    const { x, y, width, height } = step.targetPosition;
    const spotlightPadding = 8;

    return (
      <>
        {/* Dark overlay covering everything */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Top overlay */}
          <View style={[styles.overlay, { height: y - spotlightPadding }]} />
          
          {/* Middle section with sides */}
          <View style={{ flexDirection: 'row', height: height + spotlightPadding * 2 }}>
            <View style={[styles.overlay, { width: x - spotlightPadding }]} />
            
            {/* Transparent hole for spotlight */}
            <View
              style={{
                width: width + spotlightPadding * 2,
                height: height + spotlightPadding * 2,
                backgroundColor: 'transparent',
              }}
            />
            
            <View style={[styles.overlay, { flex: 1 }]} />
          </View>
          
          {/* Bottom overlay */}
          <View style={[styles.overlay, { flex: 1 }]} />
        </View>
        
        {/* Purple gradient border around spotlight */}
        <View
          style={{
            position: 'absolute',
            left: x - spotlightPadding,
            top: y - spotlightPadding,
            width: width + spotlightPadding * 2,
            height: height + spotlightPadding * 2,
            borderRadius: 20,
            overflow: 'hidden',
          }}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 3,
              left: 3,
              right: 3,
              bottom: 3,
              backgroundColor: 'transparent',
              borderRadius: 17,
            }}
          />
        </View>
      </>
    );
  };

  const getTooltipPosition = () => {
    if (!step.targetPosition) {
      return styles.tooltipCenter;
    }

    if (step.placement === 'bottom') {
      return {
        ...styles.tooltipBottom,
        top: step.targetPosition.y + step.targetPosition.height + 24,
      };
    } else if (step.placement === 'top') {
      return {
        ...styles.tooltipTop,
        bottom: SCREEN_HEIGHT - step.targetPosition.y + 24,
      };
    }
    
    return styles.tooltipCenter;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Dark overlay with spotlight cutout */}
        {renderSpotlight()}
        
        {/* Pulsing ring animation around target */}
        {step.targetPosition && step.action === 'tap' && (
          <Animated.View
            style={[
              styles.pulsingRing,
              {
                left: step.targetPosition.x + step.targetPosition.width / 2 - 40,
                top: step.targetPosition.y + step.targetPosition.height / 2 - 40,
                opacity: fadeAnim,
              },
            ]}
            pointerEvents="none"
          >
            <View style={styles.pulsingRingInner} />
          </Animated.View>
        )}

        {/* Tooltip card */}
        <Animated.View
          style={[
            styles.tooltip,
            getTooltipPosition(),
            { opacity: fadeAnim },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.tooltipCard} pointerEvents="auto">
            {/* Icon */}
            {step.icon && (
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Ionicons name={step.icon as any} size={28} color={COLORS.white} />
                </LinearGradient>
              </View>
            )}

            {/* Content */}
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>{step.title}</Text>
              <Text style={styles.tooltipDescription}>{step.description}</Text>
            </View>

            {/* Progress dots */}
            <View style={styles.progressDots}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentStep && styles.dotActive,
                  ]}
                />
              ))}
            </View>

            {/* Action buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={onSkip}
              >
                <Text style={styles.skipButtonText}>Skip Tour</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={isLastStep ? onComplete : onNext}
              >
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextButtonGradient}
                >
                  <Text style={styles.nextButtonText}>
                    {isLastStep ? 'Get Started' : 'Next'}
                  </Text>
                  <Ionicons 
                    name={isLastStep ? 'checkmark' : 'arrow-forward'} 
                    size={20} 
                    color={COLORS.white} 
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  pulsingRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  pulsingRingInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.primary,
    opacity: 0.3,
  },
  tooltip: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    alignSelf: 'center',
  },
  tooltipCenter: {
    top: SCREEN_HEIGHT / 2 - 200,
  },
  tooltipTop: {
    position: 'absolute',
  },
  tooltipBottom: {
    position: 'absolute',
  },
  tooltipCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipContent: {
    marginBottom: 20,
  },
  tooltipTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  tooltipDescription: {
    fontSize: 15,
    color: COLORS.mediumGray,
    lineHeight: 22,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.lightGray,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
