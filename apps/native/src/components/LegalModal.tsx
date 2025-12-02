import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  accent: '#A22BF6',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
};

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

const PRIVACY_POLICY = `Last Updated: December 2024

1. INFORMATION WE COLLECT

Personal Information:
• Name and email address (provided during registration)
• Fitness preferences and goals
• Workout history and progress data

Automatically Collected Information:
• Device information (type, OS version)
• Usage data (features used, session duration)
• Performance data (crash reports)

2. HOW WE USE YOUR INFORMATION

• To provide and personalize your workout experience
• To generate AI-powered workout recommendations
• To track your progress and achievements
• To send workout reminders (if enabled)
• To improve our app and services

3. DATA STORAGE

Your workout data is primarily stored locally on your device. Cloud storage is used for:
• Account authentication
• Cross-device syncing (if enabled)
• Backup of preferences

4. DATA SHARING

We do NOT sell your personal information. We may share data with:
• Service providers who help operate our app
• Analytics partners (anonymized data only)
• When required by law

5. YOUR RIGHTS

You have the right to:
• Access your personal data
• Correct inaccurate data
• Delete your account and data
• Opt out of analytics collection
• Export your data

6. SECURITY

We implement industry-standard security measures including:
• Encryption of data in transit and at rest
• Secure authentication protocols
• Regular security audits

7. CHILDREN'S PRIVACY

Thryvin is not intended for children under 13. We do not knowingly collect data from children under 13.

8. CHANGES TO THIS POLICY

We may update this policy periodically. We will notify you of significant changes via the app or email.

9. CONTACT US

For privacy-related questions:
Email: privacy@thryvin.app

For general inquiries:
Email: support@thryvin.app`;

const TERMS_OF_SERVICE = `Last Updated: December 2024

1. ACCEPTANCE OF TERMS

By downloading, installing, or using Thryvin, you agree to be bound by these Terms of Service. If you do not agree, do not use the app.

2. DESCRIPTION OF SERVICE

Thryvin is an AI-powered fitness application that provides:
• Personalized workout programs
• Progress tracking and statistics
• Achievement and badge systems
• Fitness goal management

3. USER ACCOUNTS

• You must provide accurate registration information
• You are responsible for maintaining account security
• One account per person
• You must be at least 13 years old to use the service

4. USER CONDUCT

You agree NOT to:
• Misuse or attempt to hack the service
• Share your account credentials
• Use the app for unlawful purposes
• Interfere with other users' experience
• Circumvent security features

5. HEALTH DISCLAIMER

IMPORTANT: Thryvin is NOT a medical service.
• Always consult a healthcare provider before starting any exercise program
• Listen to your body and stop if you experience pain
• We are not responsible for injuries resulting from workouts
• The app is for informational purposes only

6. INTELLECTUAL PROPERTY

• All content, features, and functionality are owned by Thryvin
• You may not copy, modify, or distribute our content
• User-generated content remains yours, but you grant us license to use it

7. SUBSCRIPTIONS & PAYMENTS

• Some features may require a paid subscription
• Subscriptions auto-renew unless cancelled
• Refunds are handled per app store policies
• Prices may change with notice

8. TERMINATION

We may suspend or terminate your account if you:
• Violate these terms
• Engage in fraudulent activity
• Haven't used the app for extended periods

9. LIMITATION OF LIABILITY

Thryvin is provided "as is" without warranties. We are not liable for:
• Fitness injuries or health issues
• Data loss
• Service interruptions
• Third-party actions

10. INDEMNIFICATION

You agree to indemnify Thryvin against claims arising from your use of the service or violation of these terms.

11. GOVERNING LAW

These terms are governed by the laws of the jurisdiction where Thryvin is headquartered.

12. CHANGES TO TERMS

We may update these terms. Continued use after changes constitutes acceptance.

13. CONTACT

Questions about these terms:
Email: legal@thryvin.app

General support:
Email: support@thryvin.app`;

export const LegalModal = ({ visible, onClose, type }: LegalModalProps) => {
  const isPrivacy = type === 'privacy';
  const content = isPrivacy ? PRIVACY_POLICY : TERMS_OF_SERVICE;
  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name={isPrivacy ? 'shield-checkmark' : 'document-text'} 
              size={40} 
              color={COLORS.accent} 
            />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.contentText}>{content}</Text>
            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Accept Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.acceptButton} onPress={onClose}>
              <Text style={styles.acceptButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  content: {
    paddingHorizontal: 20,
  },
  contentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  acceptButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
