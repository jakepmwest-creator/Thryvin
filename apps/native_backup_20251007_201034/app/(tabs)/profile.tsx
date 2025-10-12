import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Switch, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth-store';
import { useBiometricAuth } from '../../src/hooks/use-biometric-auth';
import { spacing } from '../../src/theme/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isAvailable, getBiometricType } = useBiometricAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.name}>
                {user?.name || 'User'}
              </Text>
              <Text variant="bodyMedium" style={styles.email}>
                {user?.email || 'user@example.com'}
              </Text>
              <Text variant="bodySmall" style={styles.memberSince}>
                Member since {new Date().getFullYear()}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Settings
        </Text>

        <Card style={styles.settingsCard}>
          <Card.Content>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="titleSmall">Push Notifications</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Receive workout reminders and updates
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            </View>

            <Divider style={styles.divider} />

            {isAvailable && (
              <>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text variant="titleSmall">{getBiometricType()}</Text>
                    <Text variant="bodySmall" style={styles.settingDescription}>
                      Use biometric authentication to sign in
                    </Text>
                  </View>
                  <Switch
                    value={biometricsEnabled}
                    onValueChange={setBiometricsEnabled}
                  />
                </View>
                <Divider style={styles.divider} />
              </>
            )}

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text variant="titleSmall">Dark Mode</Text>
                <Text variant="bodySmall" style={styles.settingDescription}>
                  Switch to dark theme (Coming Soon)
                </Text>
              </View>
              <Switch value={false} disabled />
            </View>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Support
        </Text>

        <Card style={styles.supportCard}>
          <Card.Content>
            <Button
              mode="text"
              onPress={() => console.log('Help Center')}
              style={styles.supportButton}
              contentStyle={styles.supportButtonContent}
            >
              Help Center
            </Button>
            
            <Button
              mode="text"
              onPress={() => console.log('Contact Support')}
              style={styles.supportButton}
              contentStyle={styles.supportButtonContent}
            >
              Contact Support
            </Button>
            
            <Button
              mode="text"
              onPress={() => console.log('Privacy Policy')}
              style={styles.supportButton}
              contentStyle={styles.supportButtonContent}
            >
              Privacy Policy
            </Button>
            
            <Button
              mode="text"
              onPress={() => console.log('Terms of Service')}
              style={styles.supportButton}
              contentStyle={styles.supportButtonContent}
            >
              Terms of Service
            </Button>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor="#EF4444"
        >
          Sign Out
        </Button>

        <Text variant="bodySmall" style={styles.version}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    color: '#1F2937',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  profileCard: {
    marginBottom: spacing.lg,
    borderRadius: 16,
    elevation: 2,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7A3CF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: '#1F2937',
    marginBottom: 4,
  },
  email: {
    color: '#6B7280',
    marginBottom: 4,
  },
  memberSince: {
    color: '#9CA3AF',
  },
  sectionTitle: {
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    color: '#1F2937',
  },
  settingsCard: {
    marginBottom: spacing.lg,
    borderRadius: 16,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingDescription: {
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  supportCard: {
    marginBottom: spacing.lg,
    borderRadius: 16,
    elevation: 2,
  },
  supportButton: {
    justifyContent: 'flex-start',
    borderRadius: 0,
  },
  supportButtonContent: {
    justifyContent: 'flex-start',
  },
  logoutButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 12,
  },
  version: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: spacing.md,
  },
});