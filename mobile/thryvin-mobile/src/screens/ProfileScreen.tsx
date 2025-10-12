import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Avatar, Switch, Divider, Ionicons, LinearGradient } from '../components/RealComponents';
import { brandColors } from '../theme/theme';

export default function ProfileScreen() {
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const menuItems = [
    { icon: 'person-outline', title: 'Personal Info', action: () => {} },
    { icon: 'fitness-outline', title: 'Fitness Goals', action: () => {} },
    { icon: 'time-outline', title: 'Workout Preferences', action: () => {} },
    { icon: 'nutrition-outline', title: 'Nutrition Settings', action: () => {} },
  ];

  const securityItems = [
    { 
      icon: 'finger-print', 
      title: 'Biometric Login', 
      subtitle: 'Use Face ID or fingerprint',
      action: () => setBiometricEnabled(!biometricEnabled),
      toggle: true,
      value: biometricEnabled,
    },
    { 
      icon: 'notifications-outline', 
      title: 'Push Notifications', 
      subtitle: 'Workout reminders and tips',
      action: () => setNotificationsEnabled(!notificationsEnabled),
      toggle: true,
      value: notificationsEnabled,
    },
  ];

  const supportItems = [
    { icon: 'help-circle-outline', title: 'Help & Support', action: () => {} },
    { icon: 'document-text-outline', title: 'Terms & Privacy', action: () => {} },
    { icon: 'information-circle-outline', title: 'About Thryvin', action: () => {} },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <LinearGradient
        colors={brandColors.gradient}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          <Avatar.Text
            size={80}
            label="U"
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <Text style={styles.userName}>Guest User</Text>
          <Text style={styles.userEmail}>Not signed in</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Days Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Awards</Text>
        </View>
      </View>

      {/* Personal Settings */}
      <Card style={styles.menuCard}>
        <Card.Content>
          <Text style={styles.menuTitle}>Personal</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.action}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={20} color={brandColors.gray600} />
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={brandColors.gray600} />
            </TouchableOpacity>
          ))}
        </Card.Content>
      </Card>

      {/* Security & Privacy */}
      <Card style={styles.menuCard}>
        <Card.Content>
          <Text style={styles.menuTitle}>Security & Privacy</Text>
          {securityItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.action}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={20} color={brandColors.gray600} />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              {item.toggle && (
                <Switch
                  value={item.value}
                  onValueChange={item.action}
                  color={brandColors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </Card.Content>
      </Card>

      {/* Support */}
      <Card style={styles.menuCard}>
        <Card.Content>
          <Text style={styles.menuTitle}>Support</Text>
          {supportItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.action}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={20} color={brandColors.gray600} />
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={brandColors.gray600} />
            </TouchableOpacity>
          ))}
        </Card.Content>
      </Card>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
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
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarLabel: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
  },
  userEmail: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    marginTop: 4,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: brandColors.white,
    marginHorizontal: 24,
    marginTop: -20,
    marginBottom: 24,
    borderRadius: 12,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: brandColors.gray100,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: brandColors.gray900,
  },
  statLabel: {
    fontSize: 12,
    color: brandColors.gray600,
    marginTop: 4,
  },
  menuCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: brandColors.white,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: brandColors.gray900,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    color: brandColors.gray900,
    marginLeft: 12,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: brandColors.gray600,
    marginTop: 2,
  },
  signOutButton: {
    marginHorizontal: 24,
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});