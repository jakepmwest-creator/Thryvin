import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient, Card, Button, Ionicons } from '../components/TempComponents';
import { brandColors } from '../theme/theme';
import { useAppStore } from '../stores/AppStore';

export default function HomeScreen() {
  const { 
    auth, 
    isLoading, 
    currentWorkout,
    userProfile,
    error,
    actions 
  } = useAppStore();

  const handleGenerateWorkout = async () => {
    // Generate AI workout using user's onboarding preferences
    await actions.generateWorkout();
  };

  // Check if user needs to complete onboarding
  const needsOnboarding = auth.isAuthenticated && userProfile && !userProfile.hasCompletedAIOnboarding;
  const canGenerateWorkout = auth.isAuthenticated && userProfile && userProfile.hasCompletedAIOnboarding;
  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={brandColors.gradient}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Good morning! 👋</Text>
          <Text style={styles.userName}>Ready to thrive today?</Text>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Ionicons name="flame" size={24} color={brandColors.primary} />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Ionicons name="barbell" size={24} color={brandColors.secondary} />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Awards</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Today's Workout */}
      <Card style={styles.workoutCard}>
        <Card.Content>
          <View style={styles.workoutHeader}>
            <Text style={styles.sectionTitle}>Today's Workout</Text>
            <Ionicons name="play-circle" size={24} color={brandColors.primary} />
          </View>
          <Text style={styles.workoutDescription}>
            {!auth.isAuthenticated ? 
              'Sign in to get personalized AI workouts' :
              needsOnboarding ? 
                'Complete your fitness onboarding to unlock personalized workouts' :
                currentWorkout ? 
                  `${currentWorkout.title || 'AI Workout Ready!'} - ${currentWorkout.duration || 30} min` : 
                  'No workout scheduled yet. Let\'s get started!'
            }
          </Text>
          
          {!auth.isAuthenticated ? (
            <Button
              mode="contained"
              style={styles.startButton}
              contentStyle={styles.buttonContent}
              onPress={() => {/* Navigate to auth */}}
            >
              Sign In
            </Button>
          ) : needsOnboarding ? (
            <Button
              mode="contained"
              style={[styles.startButton, { backgroundColor: brandColors.secondary }]}
              contentStyle={styles.buttonContent}
              onPress={() => {/* Navigate to onboarding */}}
            >
              Complete Onboarding
            </Button>
          ) : (
            <Button
              mode="contained"
              style={styles.startButton}
              contentStyle={styles.buttonContent}
              onPress={handleGenerateWorkout}
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : canGenerateWorkout ? 'Generate AI Workout' : 'Complete Profile'}
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Error Message */}
      {error && (
        <Card style={[styles.tipCard, { backgroundColor: '#FEE2E2' }]}>
          <Card.Content>
            <View style={styles.tipHeader}>
              <Ionicons name="warning" size={20} color="#DC2626" />
              <Text style={[styles.tipTitle, { color: '#DC2626' }]}>Error</Text>
            </View>
            <Text style={[styles.tipText, { color: '#7F1D1D' }]}>
              {error}
            </Text>
            <Button
              mode="outlined"
              style={{ marginTop: 8, borderColor: '#DC2626' }}
              onPress={() => actions.setError(null)}
            >
              <Text style={{ color: '#DC2626' }}>Dismiss</Text>
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Coach Tip */}
      {!error && (
        <Card style={styles.tipCard}>
          <Card.Content>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={20} color={brandColors.secondary} />
              <Text style={styles.tipTitle}>Daily Tip</Text>
            </View>
            <Text style={styles.tipText}>
              Start with 5 minutes of movement to activate your body and mind. 
              Even small steps lead to big transformations! 💪
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.gray50,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: -20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: brandColors.white,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: brandColors.gray900,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: brandColors.gray600,
    marginTop: 4,
  },
  workoutCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: brandColors.white,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: brandColors.gray900,
  },
  workoutDescription: {
    fontSize: 14,
    color: brandColors.gray600,
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: brandColors.primary,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  tipCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: brandColors.white,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: brandColors.gray900,
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: brandColors.gray600,
    lineHeight: 20,
  },
});