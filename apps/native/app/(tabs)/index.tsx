import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(162, 89, 255, 0.1)',
};

// Simple circular progress component
const ProgressRing = ({ progress = 0.7, size = 120 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={[styles.progressContainer, { width: size, height: size }]}>
      <LinearGradient
        colors={[COLORS.accent, COLORS.accentSecondary]}
        style={styles.progressGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.progressInner}>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          <Text style={styles.progressSubtext}>Weekly Goal</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const ActionButton = ({ 
  title, 
  subtitle, 
  icon, 
  onPress, 
  gradient = false 
}: {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
  gradient?: boolean;
}) => {
  if (gradient) {
    return (
      <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentSecondary]}
          style={styles.gradientButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon as any} size={24} color={COLORS.white} />
          <View style={styles.buttonTextContainer}>
            <Text style={styles.buttonTitleGradient}>{title}</Text>
            <Text style={styles.buttonSubtitleGradient}>{subtitle}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={styles.regularButton}>
        <Ionicons name={icon as any} size={24} color={COLORS.accent} />
        <View style={styles.buttonTextContainer}>
          <Text style={styles.buttonTitle}>{title}</Text>
          <Text style={styles.buttonSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back, Jake 👋</Text>
            <Text style={styles.subtitleText}>Ready to thrive today?</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {/* Progress Ring */}
        <View style={styles.progressSection}>
          <ProgressRing progress={0.7} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <ActionButton
            title="Start Workout"
            subtitle="AI-powered training"
            icon="fitness"
            gradient={true}
            onPress={() => router.push('/(tabs)/workouts')}
          />
          
          <ActionButton
            title="View Stats"
            subtitle="Track your progress"
            icon="bar-chart"
            onPress={() => router.push('/(tabs)/stats')}
          />
          
          <ActionButton
            title="Check Nutrition"
            subtitle="Meal planning & macros"
            icon="restaurant"
            onPress={() => {
              // Stubbed for later - nutrition will be added
              console.log('Nutrition feature coming soon!');
            }}
          />
        </View>

        {/* Recent Activity Placeholder */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.accent} />
            <View style={styles.activityText}>
              <Text style={styles.activityTitle}>Upper Body Strength</Text>
              <Text style={styles.activitySubtitle}>Yesterday • 45 min</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    fontWeight: '400',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  progressContainer: {
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  progressGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  progressInner: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressSubtext: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  actionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  regularButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  buttonTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  buttonTitleGradient: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  buttonSubtitleGradient: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  recentSection: {
    paddingHorizontal: 24,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityText: {
    marginLeft: 16,
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
});